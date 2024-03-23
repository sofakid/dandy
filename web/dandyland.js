import { DandyJsChain } from '/extensions/dandy/js_chain.js'
import { dandy_css_link } from '/extensions/dandy/dandycss.js'

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

    this.dandyland = null
    this.widget = null
    this.js_blob_urls = []
    
    console.log("DandyLand constructed", this)
    this.reload_dandyland()
  }

  get_canvas_blob() {
    const { dandyland } = this
    const canvas = dandyland.querySelector('canvas')
    if (!canvas) {
      console.error("no canvas found")
      return ''
    }
    let blob = null
    canvas.toBlob((o) => { blob = o })
    return blob
  }

  get_iframe_blob() {
    const { dandyland } = this
    const dandydoc = dandyland.contentDocument || dandyland.contentWindow.document
    
    const width = dandydoc.body.scrollWidth
    const height = dandydoc.body.scrollHeight

    const screenshot = document.createElement('canvas')
    screenshot.width = width
    screenshot.height = height
    const ctx = screenshot.getContext('2d')

    ctx.drawWindow(dandyland.contentWindow, 0, 0, width, height, 'transparent')

    let blob = null
    screenshot.toBlob((o) => { blob = o }, 'image/png')
    return blob
  }
  
  async upload_image() {
    const blob = this.get_canvas_blob()
    const form = new FormData()
    form.append("image", blob, filename)
    const response = await api.fetchApi("/upload/image", {
      method: "POST",
      form,
    })

    if (response.status === 200) {      
      return await response.json()
    } 
    
    console.error(`upload_image(): ${response.status} :: ${response.statusText}`, response)
    return null
  }

  on_js_updated() {
    this.reload_dandyland()
  }

  clear_dandyland() {
    const { widget, node } = this
    if (widget) {
      widget.onRemove()
      node.widgets = node.widgets.filter((x) => x !== widget)
    }
    this.dandyland = null
    this.widget = null
  }

  reload_dandyland() {
    const { node, js_chain } = this
    this.clear_dandyland()

    const dandyland = document.createElement("iframe")
    dandyland.id = `DandyLand_${i_dandy_land++}`
    dandyland.classList.add('dandyMax')

    const js_urls = js_chain.out_urls.split('\n')
    // console.log("DANDYLAND urls", js_urls)

    const script_map = (url) => `<script type="application/javascript" src=${url}></script>`
    const no_fakes = (url) => url !== 'undefined' && url.length > 0
    const script_tags = js_urls.filter(no_fakes).map(script_map)

    dandyland.srcdoc = `<html class="dandyMax"><head>${dandy_css_link}</head><body class="dandyMax">
      ${script_tags.join("\n    ")}
    </body></html>`
    
    const widget = node.addDOMWidget(dandyland.id, "dandyland", dandyland)
    this.dandyland = dandyland
    this.widget = widget
  }
}

export const new_dandy_capture_widget = (node, inputName, inputData, app) => {
  const default_value = DandyLand.capture_entire
  const values = [DandyLand.capture_entire, DandyLand.capture_canvas]
  const serialize = false

  // addWidget( type, name, value, callback, options )
  const widget = node.addWidget('combo', 
    'capture', default_value, 
    (choice, graphcanvas, node, coords) => {
      node.dandy.capture_method = choice
    },
    { values, serialize })
  
  return widget
}
