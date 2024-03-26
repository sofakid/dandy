import { DandyJsChain } from './chains.js'
import { dandy_css_link } from '/extensions/dandy/dandycss.js'
import { api } from '/scripts/api.js'

const CAPTURE_NAME = "captures"
const CAPTURE_TYPE = "DANDY_CAPTURE"

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
    this.id = `DandyLand_${i_dandy_land}`
    node.dandy = this

    if (node.properties === undefined) {
      node.properties = {}
    }
    node.size = [535, 605]

    this.iframe = null
    this.iframe_widget = null
    
    const capture_widget = node.widgets.find((x) => x.name === CAPTURE_NAME)
    this.capture_widget = capture_widget
    capture_widget.value = ''
    capture_widget.size = [0, -4] // liteGraph will pad it by 4

    capture_widget.serializeValue = async () => {
      const filenames = await this.capture()
      capture_widget.value = filenames
      return filenames
    }

    //console.log("DandyLand constructed", this)
    this.reload_iframe()
  }

  async get_canvases_blobs() {
    const { iframe } = this
    const dandydoc = iframe.contentDocument || iframe.contentWindow.document

    if (dandydoc.readyState !== 'complete') {
      console.error("dandyland content not fully loaded")
      return null
    }

    const canvases = dandydoc.body.querySelectorAll('canvas')
    if (!canvases || canvases.length === 0) {
      console.error("no canvas found")
      return null
    }
    
    let blobs = []
    for (let i = 0; i < canvases.length; ++i) {
      const canvas = canvases[i]
      await new Promise((resolve) => {
        canvas.toBlob((o) => { 
          blobs.push(o)
          resolve()
        })
      })
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
    this.reload_iframe()
  }

  clear_iframe() {
    const { iframe_widget, node } = this
    if (iframe_widget) {
      iframe_widget.onRemove()
      node.widgets = node.widgets.filter((x) => x !== iframe_widget)
    }
    this.iframe = null
    this.iframe_widget = null
  }

  reload_iframe() {
    const { node, js_chain } = this
    this.clear_iframe()

    const iframe = document.createElement("iframe")
    iframe.id = `DandyLand_${i_iframe++}`
    iframe.classList.add('dandyMax')

    const js_urls = js_chain.widget.value.split('\n')

    const script_map = (url) => `<script type="application/javascript" src=${url}></script>`
    const no_fakes = (url) => url !== 'undefined' && url.length > 0
    const script_tags = js_urls.filter(no_fakes).map(script_map)

    iframe.srcdoc = `<html class="dandyMax"><head>${dandy_css_link}</head>
                     <body class="dandyMax">${script_tags.join("")}</body></html>`
    
    const iframe_widget = node.addDOMWidget(iframe.id, "iframe", iframe)
    this.iframe = iframe
    this.iframe_widget = iframe_widget
  }
}
