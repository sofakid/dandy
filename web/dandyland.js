import { IO, DandyHtmlChain, DandyJsChain, DandyCssChain, DandyJsonChain, DandyWasmChain,
         DandyYamlChain, DandyImageUrlChain, DandyStringChain } from '/extensions/dandy/chains.js'
import { Mimes, DandyNames, dandy_cash, DandyNode, dandy_delay } from '/extensions/dandy/dandymisc.js'
import { dandy_css_link } from '/extensions/dandy/dandycss.js'
import { DandySocket } from '/extensions/dandy/socket.js'
import { api } from '/scripts/api.js'

const load_url = async (url) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      this.error_log('Failed to fetch url', url)
      return ""
    }
    return await response.text()

  } catch (error) {
    this.error_log('Failed to fetch url', url, error)
    return ""
  }
}

const load_list_of_urls = async (urls, f) => {
  const out = []
  for (let i = 0; i < urls.length; ++i) {
    const url = urls[i]      
    const text = await load_url(url)
    if (text.length > 0) {
      const o = f(text)
      out.push(o)
    }
  }
  return out
}

// ======================================================================
let i_dandy_land = 0
let i_iframe = 0
export class DandyLand extends DandyNode {
  static capture_entire = 'entire'
  static capture_canvas = 'canvas'

  constructor(node, app) {
    super(node, app)
    this.debug_verbose = true

    this.html_chain = new DandyHtmlChain(this, IO.IN)
    this.css_chain = new DandyCssChain(this, IO.IN)
    this.js_chain = new DandyJsChain(this, IO.IN)
    this.wasm_chain = new DandyWasmChain(this, IO.IN)
    this.json_chain = new DandyJsonChain(this, IO.IN)
    this.yaml_chain = new DandyYamlChain(this, IO.IN)
    this.image_url_chain = new DandyImageUrlChain(this, IO.IN)
    this.string_chain = new DandyStringChain(this, IO.IN_OUT)

    this.chain_cache = {}
    const socket = this.socket = new DandySocket(this)
    
    this.dandy_output = {
      int: 0,
      float: 0,
      boolean: false,
      string: '',
      positive: null,
      negative: null,
    }

    this.input_int = 0
    this.input_float = 0.0
    this.input_boolean = false
    this.input_positive = ''
    this.input_negative = ''
    this.input_images_urls = []
    this.input_masks_urls = []

    socket.on_request_captures = (o) => {
      this.debug_log("socket.on_request_captures()", o)
      const { py_client, int, float, boolean, positive, negative, image, mask } = o
      const { input_images_urls, input_masks_urls } = this

      this.input_int = int
      this.input_float = float
      this.input_boolean = boolean
      this.input_positive = positive
      this.input_negative = negative
      
      input_images_urls.length = 0
      image.forEach((x, i) => {
        input_images_urls.push({
          value: x,
          id: `comfyui_image_${i}`
        })
      })

      input_masks_urls.length = 0
      mask.forEach((x, i) => {
        input_masks_urls.push({
          value: x,
          id: `comfyui_mask_${i}`
        })
      })

      this.render(py_client)
    }

    socket.on_request_hash = (py_client) => {
      this.deliver_hash(py_client)
    }

    this.canvas_hash = dandy_cash([`${Date.now()}`])
    const hash_widget = this.hash_widget = this.find_widget(DandyNames.HASH)

    const hash_f = async () => {
      const b64s = await this.get_canvases_b64s()
      return dandy_cash(b64s)
    }

    hash_widget.serializeValue = hash_f
    
    const check_for_changes = async () => {
      const hash = await hash_f()
      if (hash !== this.canvas_hash) {
        this.canvas_hash = hash
        api.dispatchEvent(new CustomEvent("graphChanged"))
      }
    }
    
    const half_sec = 500
    this.changes_interval = setInterval(check_for_changes, half_sec)

    this.dandy_continue_event_listener = null
    this.iframe = null
    this.reloading = false
    this.dirty = false
    this.rendering = false

    this.id = `DandyLand_${i_dandy_land}`
    node.dandy = this
    node.size = [535, 605]
    
    const width_widget = this.width_widget = this.find_widget("width")
    const height_widget = this.height_widget = this.find_widget("height")
    
    width_widget.callback = () => {
      this.reload_iframe()
    }
    height_widget.callback = () => {
      this.reload_iframe()
    }
    
    this.images_widget = this.find_widget(DandyNames.IMAGE_URL)

    this.frozen = false
    const freeze = () => {
      console.warn(`Freezing...`)
      freeze_widget.label = "Unfreeze"
      this.frozen = true
      this.rendering = false
      if (this.dirty) {
        this.reload_iframe()
      }
    }
    const unfreeze = () => {
      console.warn(`Unfreezing :: dirty:${this.dirty}`)
      freeze_widget.label = "Freeze"
      this.frozen = false
      this.rendering = false
      if (this.dirty) {
        this.reload_iframe()
      }
    }
    const freeze_widget = this.freeze_widget = node.addWidget("button", "choose_file_button", "", () => {
      if (this.frozen) {
        unfreeze()
      } else {
        freeze()
      }
    })
    freeze_widget.label = "Freeze"

    const divvy = this.divvy = document.createElement('div')
    divvy.classList.add('dandyMax')
    divvy.id = this.id
    const div_widget = node.addDOMWidget(divvy.id, "divvy", divvy, { serialize: false })
    this.debug_log("DandyLand constructed", this)
    this.constructed = true
    this.reload_iframe()
  }

  on_connections_change(i_or_o, index, connected, link_info, input) {
    if (link_info) {
      const is_input_slot_that_changed = i_or_o === LiteGraph.INPUT
      const is_image_slot = link_info.type === 'IMAGE'
      if (is_image_slot && is_input_slot_that_changed) {
        this.input_images_urls.length = 0
      }
    }
  }

  on_removed() {
    console.warn('Removing dandyland node')
    clearInterval(this.changes_interval)
  }

  render(py_client) {
    if (!this.frozen) {
      this.rendering = true
      this.reload_iframe()
    } 
    this.done_rendering(py_client)
  }

  async deliver_hash(py_client) {
    const { socket } = this
    const b64s = await this.get_canvases_b64s()
    const hash = dandy_cash(b64s)
    socket.deliver_hash(hash, py_client)
  }

  async done_rendering(py_client) {
    while (this.rendering) {
      const ms = 300
      this.debug_log('delaying...')
      await dandy_delay(ms)
    }
    await this.capture_and_deliver(py_client)
  }
  
  async capture_and_deliver(py_client) {
    const { socket } = this
    const b64s = await this.get_canvases_b64s()
    this.canvas_hash = dandy_cash(b64s)

    const { dandy_output } = this

    const {
      int, 
      float,
      string,
      boolean,
      positive, 
      negative, 
    } = dandy_output
    
    this.string_chain.output_update_ignoring_input(string)

    const default_value = (v, d) => v !== undefined ? v : d
    const o = {
      py_client,
      captures: b64s,
      int: default_value(int, 0),
      float: default_value(float, 0),
      boolean: default_value(boolean, false),
      string: default_value(string, ''),
      positive: default_value(positive, []),
      negative: default_value(negative, []),
    }

    this.debug_log("sending o: ", o)
    socket.deliver_captures(o)
  }

  async get_canvases() {
    const { iframe } = this

    const canvases_out = [] 

    if (iframe) {
      const dandydoc = iframe.contentDocument || iframe.contentWindow.document
      
      if (dandydoc.readyState !== 'complete') {
        this.error_log("get_canvases() :: dandyland content not fully loaded")
        return canvases_out
      }
      
      const canvas_list = dandydoc.body.querySelectorAll('canvas')
      canvas_list.forEach((x) => {
        canvases_out.push(x)
      })
    }

    if (canvases_out.length === 0) {
      const c = await this.no_canvas_found()
      canvases_out.push(c)
    }

    return canvases_out
  }

  async get_canvases_b64s() {
    const canvases = await this.get_canvases()
    const b64s = canvases.map((canvas) => canvas.toDataURL())
    return b64s
  }

  async get_canvases_blobs() {
    const canvases = await this.get_canvases()

    const blobs = []
    for (let j = 0; j < canvases.length; ++j) {
      const canvas = canvases[j]
      await new Promise((resolve) => {
        canvas.toBlob((o) => { 
          if (o) {
            blobs.push(o)
          }
          resolve()
        })
      })
    }

    return blobs
  }

  async no_canvas_found() {
    const { width_widget, height_widget, divvy } = this
    const no_canvas_id = 'dandy_no_canvas_found'
    let canvas = document.getElementById(no_canvas_id)

    if (!canvas) {
      canvas = document.createElement("canvas")
      canvas.id = no_canvas_id
      divvy.appendChild(canvas)
    }

    const width = width_widget.value
    const height = height_widget.value

    canvas.width = width > 0 ? width : 10
    canvas.height = height > 0 ? height : 10

    const ctx = canvas.getContext("2d")
    ctx.globalAlpha = 0.0
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, width, height)

    const p = width / 8
    const q = height / 8
    ctx.globalAlpha = 0.8
    ctx.fillStyle = "white"
    ctx.fillRect(p, q, width - 2 * p, height - 2 * q)

    ctx.globalAlpha = 1.0
    ctx.font = "30px Arial"
    ctx.fillStyle = "black"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("No Canvas Found", width / 2, height / 2)

    return canvas
  }

  on_chain_updated(type) {
    const { chain_cache, chains, constructed } = this
    if (!constructed) {
      this.warn_log(`on_chain_updated(${type}) :: dandyland not constructed yet`)
      return
    }
    const cached_value = chain_cache[type]
    const new_value = dandy_cash(JSON.stringify(chains[type].data))

    const v = new_value != cached_value ? '!==' : '==='
    const cv = `${cached_value}`.slice(0, 80)
    const nv = `${new_value}`.slice(0, 80)
    this.debug_log(`on_chain_updated(${type}) :: <${cv}> ${v} <${nv}>`)
    if (new_value !== cached_value) {
      chain_cache[type] = new_value
      this.reload_iframe()
    }
  }

  clear_iframe() {
    const { dandy_o_url, load_images_url, divvy, iframe, constructed } = this
    if (dandy_o_url) {
      URL.revokeObjectURL(dandy_o_url)
    }
    if (load_images_url) {
      URL.revokeObjectURL(load_images_url)
    }

    if (iframe) {
      iframe.src = 'about:blank'
      this.iframe = null
    }
    
    divvy.innerHTML = ''
  }

  reload_iframe() {
    if (this.frozen) {
      this.dirty = true
      return
    }
    if (this.reloading) {
      this.dirty = true
      return
    }
    const when_done = () => {
      this.reloading = false
      if (this.dirty) {
        this.reload_iframe()
      }
    }
    this.dirty = false
    this.reloading = true
    this.reload_iframe_job(when_done)
  }

  async reload_iframe_job (when_done) {
    const { divvy, image_url_chain,
      js_chain, html_chain, css_chain, json_chain, yaml_chain, string_chain,
      width_widget, height_widget, 
    } = this

    this.clear_iframe()
    
    const just_value = (x) => x.value
    const js_data = js_chain.data
    const html_urls = html_chain.data.map(just_value)
    const css_urls = css_chain.data.map(just_value)
    const json_urls = json_chain.data.map(just_value)
    const yaml_urls = yaml_chain.data.map(just_value)
    const image_urls = image_url_chain.data
    
    this.input_string = string_chain.data.map(just_value).join('\n')

    const htmls = await load_list_of_urls(html_urls, (x) => x)
    const jsons = await load_list_of_urls(json_urls, (x) => JSON.stringify(x))
    const yamls = await load_list_of_urls(yaml_urls, (x) => jsyaml.load(x))


    const { 
      input_int, 
      input_float, 
      input_boolean,
      input_string, 
      input_positive,
      input_negative,
    } = this

    const dandy_o = {
      int: input_int,
      float: input_float,
      boolean: input_boolean,
      string: input_string,
      positive: input_positive,
      negative: input_negative,
      image: [],
      mask: [],
      json: jsons,
      yaml: yamls,
      width: width_widget.value,
      height: height_widget.value,
      output: {
        int: input_int,
        float: input_float,
        boolean: input_boolean,
        string: input_string,
        positive: input_positive,
        negative: input_negative,
      }
    }
    const dandy_o_json = JSON.stringify(dandy_o)
    this.debug_log("dandy_o", dandy_o_json, dandy_o)
    
    const { input_images_urls, input_masks_urls } = this
    const n_input_images = input_images_urls.length
    const n_input_masks = input_masks_urls.length

    const load_one_image = (image_or_mask, url, id) => `
    (() => {
      const img = document.createElement('img')
      ${id ? 'img.id ="' + id + '"' : ''}
      img.onload = image_loaded
      img.style.display = "none"
      img.src = "${url}"
      dandy.${image_or_mask}.push(img)
      document.body.appendChild(img)
    })();
    `
    const load_images_masks_map = (image_or_mask, o) => load_one_image(image_or_mask, o.value, o.id)
    const load_images_map = (o) => load_images_masks_map('image', o)
    const load_masks_map = (o) => load_images_masks_map('mask', o)

    const load_input_images = input_images_urls.map(load_images_map).join('\n')
    const load_input_masks = input_masks_urls.map(load_masks_map).join('\n')
    const load_all_images = image_urls.map(load_images_map).join('\n')
    const load_all_masks = image_urls.map(load_masks_map).join('\n')

    const load_images_js = `
    (()=>{
      const n_images = ${image_urls.length + image_urls.length + n_input_images + n_input_masks}
      let i_image = 0
      const image_loaded = () => {
        if (++i_image === n_images) {
          dandy.onload()
        }
      }
      ${load_input_images}
      ${load_input_masks}
      ${load_all_images}
      ${load_all_masks}
      if (n_images === 0) {
        dandy.onload()
      }
    })();
    `
    const load_images_blob = new Blob([load_images_js], { type: Mimes.JS })
    const load_images_url = URL.createObjectURL(load_images_blob)
    this.load_images_url = load_images_url

    const iframe_id = `iframe_${++i_iframe}`
    const dandy_o_js = `const dandy = ${dandy_o_json}; 
    dandy.onload = () => {};
    dandy.continue = () => {
      console.warn('posting')
      window.parent.postMessage({ 'dandy_continue': true, 'iframe_id': '${iframe_id}', 'output': JSON.stringify(dandy.output) })
    }
    `
    const dandy_o_blob = new Blob([dandy_o_js], { type: Mimes.JS })
    const dandy_o_url = URL.createObjectURL(dandy_o_blob)
    this.dandy_o_url = dandy_o_url

    js_data.unshift({ value: dandy_o_url, mime: Mimes.JS })
    js_data.push({ value: load_images_url, mime: Mimes.JS })

    const script_map = (o) => `<script type="${o.mime}" src=${o.value}></script>`
    const script_tags = js_data.map(script_map).join('')

    const css_map = (url) => `<link rel="stylesheet" type="${Mimes.CSS}" href="${url}" />`
    const css_links = css_urls.map(css_map).join("") + dandy_css_link

    const lazy_html = (html) => {
      const i = html.indexOf("</body>")
      if (i === -1) {
        return `<html class="dandyMax"><head></head><body class="dandyMax">${html}</body></html>` 
      }
      return html
    }

    const html_insert_scripts = (html) => {
      const i = html.indexOf("</body>")
      const prefix = i === -1 ? html : html.slice(0, i)
      const suffix = i === -1 ? '' : html.slice(i)
      return `${prefix}${script_tags}${suffix}` 
    }

    const html_insert_css = (html) => {
      const i = html.indexOf("</head>")
      const prefix = i === -1 ? html : html.slice(0, i)
      const suffix = i === -1 ? '' : html.slice(i)
      return `${prefix}${css_links}${suffix}` 
    }
    
    if (htmls.length === 0) {
      htmls.push(`<html class="dandyMax"><head></head><body class="dandyMax"></body></html>`)
    }
  
    let iframe = null
    let iframe_doc = null
    const make_iframe = (html, on_load) => {
      iframe = document.createElement("iframe")
      iframe.id = iframe_id
      this.debug_log(`making iframe<${iframe.id}>...`)
      iframe.classList.add('dandyMax')
      iframe.onload = on_load
      iframe.srcdoc = html
      divvy.appendChild(iframe)
      this.iframe = iframe
    }

    const html = htmls[0]
    const completed_html = lazy_html(html)
    const html_with_css = html_insert_css(completed_html)
    const html_with_css_scripts = html_insert_scripts(html_with_css)
    make_iframe(html_with_css_scripts, when_done)

    if (this.dandy_continue_event_listener) {
      window.removeEventListener('message', this.dandy_continue_event_listener)
    }
    this.dandy_continue_event_listener = (event) => {
      const { iframe_id: from_iframe_id, dandy_continue, output } = event.data
      if (from_iframe_id === iframe_id && dandy_continue) {
        this.rendering = false
        this.debug_log("continue listener :: output: ", output)
        this.dandy_output = output
      } else {
        //console.warn('unknown event', event.data)
      }
    }
    window.addEventListener('message', this.dandy_continue_event_listener)
  }
}
