import { Mimes, DandyNames, dandy_cash, DandyNode, dandy_delay, DandyHashDealer, DandyTypes,
         dandy_load_list_of_urls } from '/extensions/dandy/dandymisc.js'
import { dandy_css_link } from '/extensions/dandy/dandycss.js'
import { DandySocket } from '/extensions/dandy/socket.js'
import { DandyChainData } from '/extensions/dandy/chain_data.js'
import { api } from '/scripts/api.js'

export const DandyJsModuleData = (url) => new DandyChainData(url, Mimes.JS_MODULE, DandyTypes.JS)
export const DandyJsClassicData = (url) => new DandyChainData(url, Mimes.JS, DandyTypes.JS)

// ======================================================================

let i_dandy_town = 0
let i_iframe = 0
export class DandyTown extends DandyNode {

  constructor(node, app) {
    super(node, app)
    this.debug_verbose = false
    this.concat_string_inputs = false

    this.input = {
      int: 0,
      float: 0.0,
      boolean: false,
      string: '',
      positive: [],
      negative: []
    }
    this.input_images_urls = []
    this.input_masks_urls = []

    this.chain_cache = {}
    const socket = this.socket = new DandySocket(this)
        
    this.dandy_output = JSON.stringify({
      int: 0,
      float: 0,
      boolean: false,
      string: '',
      positive: null,
      negative: null,
    })

    socket.on_sending_input = (o) => {
      this.debug_log('socket.on_sending_input()', o)
      const { py_client, input } = o
      this.input = input
      this.on_input()

      if (this.render_on_input) {
        this.render(py_client)
      }
      else {
        this.done_rendering(py_client)
      }
    }

    this.dandy_message_listener = null
    this.iframe = null
    this.reloading = false
    this.dirty = false
    this.rendering = false

    this.canvas_hash = dandy_cash([`${Date.now()}`])
    const hash_dealer = this.hash_dealer = new DandyHashDealer(this)

    hash_dealer.message_f = async () => {
      if (this.rendering || this.reloading) {
        return 'busy'
      }
      return await this.get_canvases_b64s()
    }

    const check_for_changes = async () => {
      await hash_dealer.update_message()
      const { hash } = hash_dealer 
      if (hash !== this.canvas_hash) {
        this.canvas_hash = hash
        api.dispatchEvent(new CustomEvent('graphChanged'))
      }
    }
    
    const changes_interval_ms = 15000
    this.changes_interval = setInterval(check_for_changes, changes_interval_ms)

    this.id = `DandyTown_${i_dandy_town}`
    node.dandy = this
    node.size = [535, 605]
    
    const width_widget = this.width_widget = this.find_widget('width')
    const height_widget = this.height_widget = this.find_widget('height')
    
    if (width_widget && height_widget) {
      width_widget.callback = () => {
        this.reload_iframe()
      }
      height_widget.callback = () => {
        this.reload_iframe()
      }
    }
    
    this.images_widget = this.find_widget(DandyNames.IMAGE_URL)

    this.frozen = false
    if (this.show_freeze_button) {
      const freeze = () => {
        this.debug_log(`Freezing :: dirty:${this.dirty}`)
        freeze_widget.label = 'Unfreeze'
        this.frozen = true
        this.rendering = false
        if (this.dirty) {
          this.reload_iframe()
        }
      }
      const unfreeze = () => {
        this.debug_log(`Unfreezing :: dirty:${this.dirty}`)
        freeze_widget.label = 'Freeze'
        this.frozen = false
        this.rendering = false
        if (this.dirty) {
          this.reload_iframe()
        }
      }
  
      const freeze_widget = this.freeze_widget = node.addWidget('button', 'freeze_button', '', () => {
        if (this.frozen) {
          unfreeze()
        } else {
          freeze()
        }
      })
      freeze_widget.label = 'Freeze'
    }

    this.init_widgets_above_content()

    const divvy = this.divvy = document.createElement('div')
    divvy.classList.add('dandyMax')
    divvy.id = this.id
    const iframe_widget = this.iframe_widget = node.addDOMWidget(divvy.id, 'divvy', divvy, { serialize: false })

    this.debug_log('DandyTown constructed', this)
    this.constructed = true
    //this.reload_iframe()
  }


  // --- override these -----------------------------------------------
  on_input() {
    const { input, input_images_urls, input_masks_urls } = this
    const { image, mask } = input

    this.input = input
    
    input_images_urls.length = 0
    if (image) {
      image.forEach((x, i) => {
        input_images_urls.push({
          value: x,
          id: `image_${i}`
        })
      })
    }

    input_masks_urls.length = 0
    if (mask) {
      mask.forEach((x, i) => {
        input_masks_urls.push({
          value: x,
          id: `mask_${i}`
        })
      })
    }
  }

  init_widgets_above_content() {
  }

  get render_on_input() {
    return true
  }

  get show_freeze_button() {
    return false
  }

  get html_urls() {
    return []
  }

  get css_urls() {
    return []
  }
  
  get json_urls() {
    return []
  }

  get yaml_urls() {
    return []
  }

  get image_urls() {
    return []
  }
  
  get js_data() {
    return []
  }
  get image_inputs() {

  }

  output_int(int) {
  }

  output_float(float) {
  }

  output_boolean(boolean) {
  }

  output_string(string) {
  }

  on_message(o) {
  }

  async make_dandy_o() {
    const { json_urls, yaml_urls, width_widget, height_widget, 
      input } = this
    
    const jsons = await dandy_load_list_of_urls(json_urls, (x) => JSON.stringify(x))
    const yamls = await dandy_load_list_of_urls(yaml_urls, (x) => jsyaml.load(x))

    // image and mask just need to initialized, they will populate
    return {
      int: input.int,
      float: input.float,
      boolean: input.boolean,
      string: input.string,
      positive: input.positive,
      negative: input.negative,
      image: [],
      mask: [],
      json: jsons,
      yaml: yamls,
      width: width_widget ? width_widget.value : 512,
      height: height_widget ? height_widget.value : 512,
      output: {
        int: input.int,
        float: input.float,
        boolean: input.boolean,
        string: input.string,
        positive: input.positive,
        negative: input.negative,
      }
    }
  }

  // ----------------------------------------------------------------

  send_message(o) {
    const { iframe } = this
    if (!iframe) {
      return
    }
    const { contentWindow } = iframe
    if (!contentWindow) {
      return
    }
    contentWindow.postMessage(o, '*')
  }

  on_connections_change(i_or_o, index, connected, link_info, input) {
    if (this.constructed && link_info) {
      const is_input_slot_that_changed = i_or_o === LiteGraph.INPUT
      const is_image_slot = link_info.type === 'IMAGE'
      if (is_image_slot && is_input_slot_that_changed) {
        this.input_images_urls.length = 0
        this.input_masks_urls.length = 0
      }
    }
  }

  on_removed() {
    console.warn('Removing dandytown node')
    clearInterval(this.changes_interval)
  }

  render(py_client) {
    if (!this.frozen) {
      this.rendering = true
      this.reload_iframe()
    } 
    this.done_rendering(py_client)
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
    const { socket, hash_dealer } = this
    const b64s = await this.get_canvases_b64s()
    hash_dealer.message = b64s
    this.canvas_hash = hash_dealer.hash

    const { dandy_output } = this

    let o = {
      py_client,
      captures: b64s,
      int: 0,
      float: 0,
      boolean: false,
      string: 'error',
      positive: [],
      negative: [],
    }

    try {
      const o_dandy_output = JSON.parse(dandy_output)
      const {
        int, 
        float,
        string,
        boolean,
        positive, 
        negative, 
      } = o_dandy_output
  
      this.debug_log('capture and deliver 1', dandy_output, typeof dandy_output)
      
      this.output_int(int)
      this.output_float(float)
      this.output_boolean(boolean)
      this.output_string(string)
     
      this.debug_log('capture and deliver 2', dandy_output)
      const default_value = (v, d) => v !== undefined ? v : d
      o = {
        py_client,
        captures: b64s,
        int: default_value(int, 0),
        float: default_value(float, 0),
        boolean: default_value(boolean, false),
        string: default_value(string, 'defaulty'),
        positive: default_value(positive, []),
        negative: default_value(negative, []),
      }
      this.debug_log('capture and deliver 3', o, string)
    } catch (error) {
      this.debug_log(`Can't parse dandy.ouput`, dandy_output, error)
      this.error_log(`Can't parse dandy.ouput`, dandy_output, error)
    }

    this.debug_log('sending o: ', o)
    socket.thanks(py_client, o)
  }

  async get_canvases() {
    const { iframe } = this

    const canvases_out = [] 

    if (iframe) {
      const dandydoc = iframe.contentDocument || iframe.contentWindow.document
      
      while (dandydoc.readyState !== 'complete') {
        await dandy_delay(100)
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
      canvas = document.createElement('canvas')
      canvas.id = no_canvas_id
      divvy.appendChild(canvas)
    }

    const width = width_widget ? width_widget.value : 512
    const height = height_widget ? height_widget.value : 512

    canvas.width = width > 0 ? width : 10
    canvas.height = height > 0 ? height : 10

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)

    const p = width / 8
    const q = height / 8
    ctx.fillStyle = 'white'
    ctx.fillRect(p, q, width - 2 * p, height - 2 * q)

    ctx.font = '30px Arial'
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('No Canvas Found', width / 2, height / 2)

    return canvas
  }

  load_inputs_from_chains() {
    const { int_chain, float_chain, string_chain, boolean_chain } = this
    const f = (o) => o.value
    this.input_int = int_chain.data.map(f)
    this.input_float = float_chain.data.map(f)
    this.input_boolean = boolean_chain.data.map(f)
    this.input_string = string_chain.data.map(f)
  }

  on_chain_updated(chain) {
    const { chain_cache, constructed } = this
    const { key } = chain
    if (!constructed) {
      this.debug_log(`on_chain_updated(${key}) :: dandytown not constructed yet`)
      return
    }
    const cached_value = chain_cache[key]
    const new_value = dandy_cash(chain.data)

    // const v = new_value != cached_value ? '!==' : '==='
    // const cv = `${cached_value}`.slice(0, 80)
    // const nv = `${new_value}`.slice(0, 80)
    // this.debug_log(`on_chain_updated(${key}) :: <${cv}> ${v} <${nv}>`)
    if (new_value !== cached_value) {
      chain_cache[key] = new_value
      this.load_inputs_from_chains()
      this.reload_iframe()
    }
  }

  clear_iframe() {
    const { dandy_o_url, load_images_url, divvy, iframe } = this
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
    const { divvy, image_urls,
      js_data, html_urls, css_urls, json_urls, yaml_urls,
      width_widget, height_widget, image_inputs
    } = this

    this.clear_iframe()
    
    const htmls = await dandy_load_list_of_urls(html_urls, (x) => x)
    
    const dandy_o = await this.make_dandy_o()

    const dandy_o_json = JSON.stringify(dandy_o)
    this.debug_log('dandy_o', dandy_o_json, dandy_o)
    
    const { input_images_urls, input_masks_urls } = this
    const n_input_images = input_images_urls.length
    const n_input_masks = input_masks_urls.length

    const o_image_urls = image_urls.map((x, i) => ({
      value: x, 
      id: `image_url_${i}`
    }))

    const o_mask_urls = image_urls.map((x, i) => ({
      value: x, 
      id: `mask_url_${i}`
    }))

    const load_one_image = (image_or_mask, url, id) => `
      (() => {
        const img = document.createElement('img')
        ${id ? 'img.id ="' + id + '"' : ''}
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
    const load_all_images = o_image_urls.map(load_images_map).join('\n')
    const load_all_masks = o_mask_urls.map(load_masks_map).join('\n')

    const n_resources = image_urls.length + image_urls.length + n_input_images + n_input_masks
    // this.debug_log(`load_all_images`, load_all_images)
    const load_images_js = `
    (()=>{
      ${load_input_images}
      ${load_input_masks}
      ${load_all_images}
      ${load_all_masks}

      const load_images = () => {
        const dandy_resources = new DandyResources()

        dandy.image.forEach((image) => {
          dandy_resources.resource_loaded(image)
        })
        
        dandy.mask.forEach((image) => {
          dandy_resources.resource_loaded(image)
        })  
      }

      if (document.readyState === 'complete') {
        load_images()
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          load_images()
        })
      }

    })();
    `

    //this.debug_log(`load_images_js: ${load_images_js.slice(0, 300)}`)
    const load_images_blob = new Blob([load_images_js], { type: Mimes.JS })
    const load_images_url = URL.createObjectURL(load_images_blob)
    this.load_images_url = load_images_url
    js_data.push({ value: load_images_url, mime: Mimes.JS })


    const iframe_id = `iframe_${++i_iframe}`
    const dandy_o_js = `
      const dandy = ${dandy_o_json}
      let dandy_loaded = false
      dandy.onload = () => {}
      dandy.await_loaded = async () => {
        const dandy_delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
        while (dandy_loaded === false) {
          console.log('awaiting dandy_loaded')
          await dandy_delay(50)
        }
        console.log('dandy.await_loaded() done, dandy_loaded:', dandy_loaded)
      }
      dandy.continue = () => {
        window.parent.postMessage({ 'dandy_continue': true, 'iframe_id': '${iframe_id}', 'output': JSON.stringify(dandy.output) })
      }
      dandy.message = (o) => {
        o.iframe_id = '${iframe_id}'
        window.parent.postMessage(o)
      }
      class DandyResources {
        constructor() {
          this.n = ${n_resources}
          this.i = 0
          if (${n_resources} === 0) {
            this.dandy_ready()
          }
        }

        count_resource = () => {
          this.i++
          //console.log(\`loaded \${this.i} of \${this.n} resources...\`)
          if (this.i === this.n) {
            this.dandy_ready()
          }
        }

        resource_loaded = (resource) => {
          console.log('resource_loaded', resource, resource.complete)
          if (resource.complete) {
            //console.log('resource_loaded resource.complete', resource)

            this.count_resource()
          } else {
            //console.log('resource_loaded setting onload', resource)

            resource.onload = () => {
              //console.log('resource_loaded :: onload!!!', resource)
              this.count_resource()
            }
            resource.onerror = () => {
              console.error('Failed to load resource.', resource)
              this.count_resource()
            }
          }
        }

        dandy_ready = () => {
          dandy.onload()
          dandy_loaded = true
        }
      }
      `
    const dandy_o_script = `<script type="${Mimes.JS}">${dandy_o_js}</script>`

    const script_map = (o) => {
      const qs = o.value.startsWith('blob') ? '' : `?never_cache=${Date.now()}`
      return `<script type="${o.mime}" src="${o.value}${qs}"></script>`
    }
    const script_tags_list = js_data.map(script_map)
    script_tags_list.unshift(dandy_o_script)
    const script_tags = script_tags_list.join('')

    const css_map = (url) => `<link rel="stylesheet" type="${Mimes.CSS}" href="${url}" />`
    const css_links = css_urls.map(css_map).join('') + dandy_css_link

    const lazy_html = (html) => {
      const i = html.indexOf('</body>')
      if (i === -1) {
        return `<html class="dandyMax"><head></head><body class="dandyMax">${html}</body></html>` 
      }
      return html
    }

    const html_insert_scripts = (html) => {
      const i = html.indexOf('</body>')
      const prefix = i === -1 ? html : html.slice(0, i)
      const suffix = i === -1 ? '' : html.slice(i)
      return `${prefix}${script_tags}${suffix}` 
    }

    const html_insert_css = (html) => {
      const i = html.indexOf('</head>')
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
      iframe = document.createElement('iframe')
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

    if (this.dandy_message_listener) {
      window.removeEventListener('message', this.dandy_message_listener)
    }
    this.dandy_message_listener = (event) => {
      const { iframe_id: from_iframe_id, dandy_continue, output } = event.data
      if (from_iframe_id === iframe_id) {
        if (dandy_continue) {
          this.rendering = false
          //this.debug_log('continue listener :: output: ', output)
          this.dandy_output = output
        } else {
          this.debug_log('dandy_message_listener :: event.data: ', event.data)
          this.on_message(event.data)
        }
      } else {
        //console.warn('unknown event', event.data)
      }
    }
    window.addEventListener('message', this.dandy_message_listener)
  }
}
