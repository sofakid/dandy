import { DandyHtmlChain, DandyJsChain, DandyCssChain, DandyJsonChain, DandyYamlChain } from '/extensions/dandy/chains.js'
import { Mimes, DandyNames } from '/extensions/dandy/dandymisc.js'
import { dandy_css_link } from '/extensions/dandy/dandycss.js'
import { api } from '/scripts/api.js'


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
export class DandyLand {
  static capture_entire = 'entire'
  static capture_canvas = 'canvas'

  constructor(node, app) {
    this.node = node
    this.app = app
    this.js_chain = new DandyJsChain(this, node, app)
    this.html_chain = new DandyHtmlChain(this, node, app)
    this.css_chain = new DandyCssChain(this, node, app)
    this.json_chain = new DandyJsonChain(this, node, app)
    this.yaml_chain = new DandyYamlChain(this, node, app)

    this.reloading = false
    this.dirty = false

    this.id = `DandyLand_${i_dandy_land}`
    node.dandy = this

    node.size = [535, 605]

    this.iframes = []
    this.iframe_widgets = []
    
    const find_widget = (widget_name) => {
      return node.widgets.find((x) => x.name === widget_name)
    }

    this.width_widget = find_widget("width")
    this.height_widget = find_widget("height")
    this.images_widget = find_widget("images")
    this.masks_widget = find_widget("masks")

    const capture_widget = find_widget(DandyNames.CAPTURES)
    this.capture_widget = capture_widget
    capture_widget.value = ''
    capture_widget.size = [0, -4] // liteGraph will pad it by 4

    capture_widget.serializeValue = async () => {
      const filenames = await this.capture()
      capture_widget.value = filenames
      return filenames
    }

    const divvy = this.divvy = document.createElement('div')
    divvy.classList.add('dandyMax')
    divvy.id = this.id
    const div_widget = node.addDOMWidget(divvy.id, "divvy", divvy, { serialize: false })
    //console.log("DandyLand constructed", this)
    this.reload_iframe()
  }

  async get_canvases_blobs() {
    const { iframes } = this
    
    let blobs = []
    for (let i = 0; i < iframes.length; ++i) {
      const iframe = iframes[i]
      const dandydoc = iframe.contentDocument || iframe.contentWindow.document

      if (dandydoc.readyState !== 'complete') {
        console.error("dandyland content not fully loaded")
        continue
      }
  
      const canvases = dandydoc.body.querySelectorAll('canvas')
      if (!canvases || canvases.length === 0) {
        console.error("no canvas found")
        continue
      }
      
      for (let j = 0; j < canvases.length; ++j) {
        const canvas = canvases[j]
        await new Promise((resolve) => {
          canvas.toBlob((o) => { 
            blobs.push(o)
            resolve()
          })
        })
      }
    }

    return blobs
  }

  async capture() {
    const blobs = await this.get_canvases_blobs()
    const filenames = []

    console.log("capture() blobs", blobs)
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
    console.log(`Dandyland chain updated. reloading: ${this.reloading} dirty: ${this.dirty}`)
    this.reload_iframe()
  }

  
  clear_iframe() {
    const { dandy_o_url, divvy } = this
    if (dandy_o_url) {
      URL.revokeObjectURL(dandy_o_url)
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
    const { node, divvy, 
      js_chain, html_chain, css_chain, json_chain, yaml_chain,
      width_widget, height_widget, images_widget, masks_widget 
    } = this

    this.clear_iframe()

    const js_urls = js_chain.urls
    const html_urls = html_chain.urls
    const css_urls = css_chain.urls
    const json_urls = json_chain.urls
    const yaml_urls = yaml_chain.urls
    
    const htmls = await load_list_of_urls(html_urls, (x) => x)
    const jsons = await load_list_of_urls(json_urls, (x) => JSON.stringify(x))
    const yamls = await load_list_of_urls(yaml_urls, (x) => jsyaml.load(x))
    
    const dandy_o = {
      images: '', //images_widget.value,
      masks: '', //masks_widget.value,
      json: jsons,
      yaml: yamls,
      width: width_widget.value,
      height: height_widget.value 
    }
    const dandy_o_json = JSON.stringify(dandy_o)
    const dandy_o_js = `const dandy = ${dandy_o_json}`
    const dandy_o_blob = new Blob([dandy_o_js], { type: Mimes.JS })
    const dandy_o_url = URL.createObjectURL(dandy_o_blob)
    this.dandy_o_url = dandy_o_url
    
    js_urls.unshift(dandy_o_url)

    const css_map = (url) => `<link rel="stylesheet" type="${Mimes.CSS}" href="${url}" />`
    const script_map = (url) => `<script type="${Mimes.JS}" src=${url}></script>`
    
    const css_links = css_urls.map(css_map).join("")
    const script_tags = js_urls.map(script_map).join("")


    const make_iframe = (on_load) => {
      const iframe = document.createElement("iframe")
      iframe.id = `DandyLand_${i_iframe++}`
      iframe.classList.add('dandyMax')
      iframe.addEventListener('load', on_load)
      return iframe
    }
    
    const lazy_html = (html) => {
      const i = html.indexOf("</body>")
      if (i === -1) {
        return `<html><head></head><body>${html}</body></html>` 
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
      const iframe = make_iframe(when_done)
      iframe.srcdoc = `<html class="dandyMax"><head>${dandy_css_link}${css_links}</head>
                       <body class="dandyMax">${script_tags}</body></html>`
      divvy.appendChild(iframe)
      
    } else {
      console.log("foreach html", htmls)
      const n_htmls = htmls.length
      let i_htmls_loaded = 0
      const on_load = () => {
        if (++i_htmls_loaded === n_htmls) {
          console.log("done loading iframes")
          when_done()
        }
      }
      
      htmls.forEach((html) => {
        const iframe = make_iframe(on_load)
        const completed_html = lazy_html(html)
        const html_with_css = html_insert_css(completed_html)
        const html_with_css_scripts = html_insert_scripts(html_with_css)
        console.log("setting srcdoc", html_with_css_scripts)
        iframe.srcdoc = html_with_css_scripts
        divvy.appendChild(iframe)
      })
    }

  }

  
}
