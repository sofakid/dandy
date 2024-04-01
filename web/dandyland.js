import { IO, DandyHtmlChain, DandyJsChain, DandyCssChain, DandyJsonChain,
         DandyYamlChain, DandyB64ImagesChain, DandyB64MasksChain } from '/extensions/dandy/chains.js'
import { Mimes, DandyNames, DandyTypes, DandyNode } from '/extensions/dandy/dandymisc.js'
import { dandy_css_link } from '/extensions/dandy/dandycss.js'
import { api } from '/scripts/api.js'
import { DandySocket } from '/extensions/dandy/socket.js'


const load_url = async (url) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error('Failed to fetch url', url)
      return ""
    }
    return await response.text()

  } catch (error) {
    console.error('Failed to fetch url', url, error)
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
    this.js_chain = new DandyJsChain(this, IO.IN)
    this.html_chain = new DandyHtmlChain(this, IO.IN)
    this.css_chain = new DandyCssChain(this, IO.IN)
    this.json_chain = new DandyJsonChain(this, IO.IN)
    this.yaml_chain = new DandyYamlChain(this, IO.IN)
    this.b64images_chain = new DandyB64ImagesChain(this, IO.IN)
    this.b64masks_chain = new DandyB64MasksChain(this, IO.IN)

    this.chain_cache = {}
    const socket = this.socket = new DandySocket()

    const service_widget = this.service_widget = this.find_widget(DandyNames.SERVICE_ID)
    service_widget.serializeValue = async () => {
      console.warn("Serializing serivce_id...")
      return await socket.get_service_id()
    }
    
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
    this.images_widget = this.find_widget("images")
    this.masks_widget = this.find_widget("masks")

    width_widget.callback = () => {
      this.reload_iframe()
    }
    height_widget.callback = () => {
      this.reload_iframe()
    }

    const N = DandyNames
    const T = DandyTypes
    const capture_widget = this.find_widget(N.CAPTURES)
    this.capture_widget = capture_widget
    capture_widget.value = ''
    capture_widget.size = [0, -4] // liteGraph will pad it by 4

    capture_widget.serializeValue = async () => {
      const filenames = await this.capture()
      capture_widget.value = filenames
      return filenames
    }

    this.images_widget = this.find_widget(N.B64IMAGES)
    this.masks_widget = this.find_widget(N.B64MASKS)

    const divvy = this.divvy = document.createElement('div')
    divvy.classList.add('dandyMax')
    divvy.id = this.id
    const div_widget = node.addDOMWidget(divvy.id, "divvy", divvy, { serialize: false })
    //console.log("DandyLand constructed", this)
    this.reload_iframe()
  }

  async get_canvases_blobs() {
    const { iframe } = this

    let blobs = []
    const dandydoc = iframe.contentDocument || iframe.contentWindow.document

    if (dandydoc.readyState !== 'complete') {
      console.error("dandyland content not fully loaded")
      return blobs
    }

    const canvases = dandydoc.body.querySelectorAll('canvas')
    if (canvases) {
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
    }

    if (blobs.length === 0) {
      const blob = await this.no_canvas_found()
      blobs.push(blob)
    }

    return blobs
  }

  async no_canvas_found() {
    const { width_widget, height_widget, divvy } = this
    const canvas = document.createElement("canvas")
    divvy.appendChild(canvas)

    const width = width_widget.value
    const height = height_widget.value

    canvas.width = width > 0 ? width : 10
    canvas.height = height > 0 ? height : 10

    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, width, height)

    ctx.font = "30px Arial"
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("No Canvas Found", width / 2, height / 2)

    let blob = null
    await new Promise((resolve) => {
      canvas.toBlob((o) => {
        blob = o
        resolve()
      })
    })
    return blob
  }

  async capture() {
    const blobs = await this.get_canvases_blobs()
    const filenames = []

    for (let i = 0; i < blobs.length; ++i) {
      const blob = blobs[i]
      const form = new FormData()
      const filename = `${this.id}_capture_${i}_${Date.now()}.png`

      form.append("image", blob, filename)
      const response = await api.fetchApi("/upload/image", {
        method: "POST",
        body: form,
      })
  
      if (response.status === 200) {
        filenames.push(filename)
      } else {
        console.error("uploading capture failed", response)      
      } 
    }
    
    return filenames.join('\n')
  }

  on_chain_updated(type) {
    const { chain_cache, chains } = this
    const cached_value = chain_cache[type]
    const new_value = chains[type].data.join()

    if (new_value != cached_value) {
      chain_cache[type] = new_value
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

    if (iframe !== null) {
      const iframe_win = iframe.contentWindow.document
      const iframe_doc = iframe.contentDocument || iframe_win.document
  
      iframe_doc.querySelectorAll('*').forEach( (x) => {
        const deep = true
        const clone = x.cloneNode(deep)
        x.parentNode.replaceChild(clone, x)
      })
  
      iframe.src = 'about:blank'
      this.iframe = null
    }
    
    divvy.innerHTML = ''
  }

  reload_iframe() {
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
    const { divvy, node, b64images_chain, b64masks_chain,
      js_chain, html_chain, css_chain, json_chain, yaml_chain,
      width_widget, height_widget, images_widget, masks_widget 
    } = this

    this.clear_iframe()
    
    const js_urls = js_chain.data
    const html_urls = html_chain.data
    const css_urls = css_chain.data
    const json_urls = json_chain.data
    const yaml_urls = yaml_chain.data
    const image_urls = b64images_chain.data
    const mask_urls = b64masks_chain.data
    
    const htmls = await load_list_of_urls(html_urls, (x) => x)
    const jsons = await load_list_of_urls(json_urls, (x) => JSON.stringify(x))
    const yamls = await load_list_of_urls(yaml_urls, (x) => jsyaml.load(x))
    
    const dandy_o = {
      images: [],
      masks: [],
      json: jsons,
      yaml: yamls,
      width: width_widget.value,
      height: height_widget.value 
    }
    const dandy_o_json = JSON.stringify(dandy_o)
    
    const load_one_image = (dst, url) => `(() => {
      const img = document.createElement('img')
      img.onload = image_loaded
      img.style.display = "none"
      img.src = "${url}"
      dandy.${dst}.push(img)
      document.body.appendChild(img)
    })();
    `
    const load_images_map = (url) => load_one_image('images', url)
    const load_masks_map = (url) => load_one_image('images', url)
    
    const load_all_images = image_urls.map(load_images_map).join('\n')
    const load_all_masks = mask_urls.map(load_masks_map).join('\n')

    const load_images_js = `
    (()=>{
      const n_images = ${image_urls.length + mask_urls.length}
      let i_image = 0
      const image_loaded = () => {
        if (++i_image === n_images) {
          dandy.onload()
        }
      }
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
    const dandy_o_js = `const dandy = ${dandy_o_json}; dandy.onload = () => {};`
    const dandy_o_blob = new Blob([dandy_o_js], { type: Mimes.JS })
    const dandy_o_url = URL.createObjectURL(dandy_o_blob)
    this.dandy_o_url = dandy_o_url

    js_urls.unshift(dandy_o_url)
    js_urls.push(load_images_url)

    const script_map = (url) => `<script type="${Mimes.JS}" src=${url}></script>`
    const script_tags = js_urls.map(script_map)
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
      console.log(`making iframe<${iframe.id}>...`)
      iframe.classList.add('dandyMax')
      iframe.onload = on_load
      iframe.srcdoc = html
      divvy.appendChild(iframe)
      iframe_doc = iframe.contentDocument || iframe.contentWindow.document
      this.iframe = iframe
    }

    const html = htmls[0]
    const completed_html = lazy_html(html)
    const html_with_css = html_insert_css(completed_html)
    const html_with_css_scripts = html_insert_scripts(html_with_css)
    make_iframe(html_with_css_scripts, when_done)
  }
}
