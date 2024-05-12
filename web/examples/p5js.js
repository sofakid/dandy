import { DandyJs } from "/extensions/dandy/editors.js"
import { DandyChain, DandyJsChain } from "/extensions/dandy/chains.js"
import { DandyNode, DandyTypes, Mimes } from '/extensions/dandy/dandymisc.js'

export class DandyP5JsSetup extends DandyJs {
  static default_text = `function setup() {
  noLoop()
  createCanvas(dandy.width, dandy.height)
}`
  constructor(node, app) {
    super(node, app, Mimes.JS)
    node.size = [400, 230]

    this.set_text(DandyP5JsSetup.default_text)
  }
}

export class DandyP5JsDraw extends DandyJs {
  static default_text = `async function draw() {
  await dandy.await_loaded()
  background(0, 0, 0)
  
  dandy.continue()
}`

  constructor(node, app) {
    super(node, app, Mimes.JS)
    node.size = [450, 270]

    this.set_text(DandyP5JsDraw.default_text)
  }
}

let i_texty_widget = 0
export class DandyP5JsLoader extends DandyNode {
  constructor(node, app) {
    super(node, app)
    this.chain = new DandyJsChain(this, 1, 1)
    this.type = DandyTypes.JS

    if (DandyChain.debug_blobs) {
      node.size = [380, 100]
    } else {
      node.size = [290, 75]
    }

    this.js_blob = null
    this.js_url = ""
    this.serialize_widgets = false

    const texty = document.createElement("pre")
    texty.id = `texty_${i_texty_widget++}`
    texty.classList.add("dandyMax")
    this.texty = texty

    const texty_widget = node.addDOMWidget(texty.id, "pre", texty)

    this.load_p5js()
  }

  async load_p5js() {
    const response = await fetch(`/extensions/dandy/p5/p5.js_`)
    const text = await response.text()
    this.js_blob = new Blob([text], { type: Mimes.JS })
    this.js_url = URL.createObjectURL(this.js_blob)

    this.chain.contributions = this.js_url
    this.chain.update_chain()

    const p = new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = function(event) {
        const content = event.target.result
        const lines = content.split('\n')
        const topLine = lines[0]
        resolve(topLine)
      }

      reader.onerror = (event) => {
        reject(event.target.error)
      }

      reader.readAsText(this.js_blob.slice(0, 1024)) // only the first 1KB
    })

    p.then(topLine => {
      this.texty.innerText = topLine
    })
    .catch(error => {
      this.error_log("Error reading top line of p5.js:", error)
    })
  }
}