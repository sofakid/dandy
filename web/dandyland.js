import { DandyJsChain } from '/extensions/dandy/js_chain.js'
import { dandy_css_link } from '/extensions/dandy/dandycss.js'
import { api } from '/scripts/api.js'

const CAPTURE_NAME = "capture"
const CAPTURE_TYPE = "DANDY_CAPTURE"

// ======================================================================
let i_dandy_land = 0
export class DandyLand {
  static capture_entire = 'entire'
  static capture_canvas = 'canvas'

  constructor(node, app) {
    this.node = node
    this.app = app
    this.js_chain = new DandyJsChain(this, node, app)

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
      const filename = await this.capture()
      console.log("capture_widget.serializeValue() :: filename", filename)
      capture_widget.value = filename
      return filename
    }

    node.onExecutionStart = () => {
      console.log("DandyLand node.onExecutionStart()")
    }

    console.log("DandyLand constructed", this)
    this.reload_iframe()
  }

  async get_canvas_blob() {
    const { iframe } = this
    const dandydoc = iframe.contentDocument || iframe.contentWindow.document

    if (dandydoc.readyState !== 'complete') {
      console.error("iframe content not fully loaded")
      return null
    }

    const canvas = dandydoc.body.querySelector('canvas')
    if (!canvas) {
      console.error("no canvas found")
      return null
    }
    let blob = null
    
    console.log("before")
    await new Promise((resolve, reject) => {
      canvas.toBlob((o) => { 
        console.log("canvas.toBlob", o)
        if (o) {
          blob = o
          resolve()
        } else {
          reject("Error creating blob")
        }
      })
    }).catch(error => {
      console.error("Error converting canvas to blob:", error)
      return null
    })
    console.log("after", blob)
    return blob
  }

  get_iframe_blob() {
    const { iframe } = this
    const dandydoc = iframe.contentDocument || iframe.contentWindow.document
    
    const width = dandydoc.body.scrollWidth
    const height = dandydoc.body.scrollHeight

    const screenshot = dandydoc.createElement('canvas')
    screenshot.width = width
    screenshot.height = height
    const ctx = screenshot.getContext('2d')
    console.log("CTX", ctx)

    ctx.drawImage(iframe.contentWindow, 0, 0, width, height, 'transparent')

    let blob = null
    screenshot.toBlob((o) => { blob = o }, 'image/png')
    return blob
  }
  
  async capture() {
    console.log("dandyland capturing...")
    const blob = await this.get_canvas_blob()
    if (blob === null) {
      console.error("capture() null blob")
      return ''
    }
    const form = new FormData()
    const filename = 'dandy_capture.png'
    form.append("image", blob, filename)
    const response = await api.fetchApi("/upload/image", {
      method: "POST",
      body: form,
    })

    console.log("capture(): response", response)
    if (response.status === 200) {      
      const o = await response.json()
      return o.name
    } 
    
    console.error(`capture(): ${response.status} :: ${response.statusText}`, response)
    return {}
  }

  on_js_updated() {
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
    iframe.id = `DandyLand_${i_dandy_land++}`
    iframe.classList.add('dandyMax')

    const js_urls = js_chain.js_widget.value.split('\n')
    // console.log("DANDYLAND urls", js_urls)

    const script_map = (url) => `<script type="application/javascript" src=${url}></script>`
    const no_fakes = (url) => url !== 'undefined' && url.length > 0
    const script_tags = js_urls.filter(no_fakes).map(script_map)

    iframe.srcdoc = `<html class="dandyMax"><head>${dandy_css_link}</head><body class="dandyMax">
      ${script_tags.join("\n    ")}
    </body></html>`
    
    const iframe_widget = node.addDOMWidget(iframe.id, "iframe", iframe)
    this.iframe = iframe
    this.iframe_widget = iframe_widget
  }
}
