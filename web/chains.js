import { DandyWidget } from "/extensions/dandy/dandymisc.js"

const JS_NAME = 'js'
const JS_TYPE = 'JS_URLS'

const HTML_NAME = "html"
const HTML_TYPE = "HTML_URLS"

const CSS_NAME = "css"
const CSS_TYPE = "CSS_URLS"

const JSON_NAME = "json"
const JSON_TYPE = "JSON_URLS"

const YAML_NAME = "yaml"
const YAML_TYPE = "YAML_URLS"

export class DandyChain {
  static debug_blobs = false

  constructor(dandy, node, app, name, type) {
    this.dandy = dandy
    this.node = node
    this.app = app
    this.name = name
    this.type = type

    if (dandy.chains === undefined) {
      dandy.chains = {}
    }
    dandy.chains[type] = this

    this.contributions = ''

    const widget = node.widgets.find((x) => x.name === name)
    this.widget = widget
    widget.value = ''
    widget.size = [0, -4] // litegraph will pad it by 4
    widget.callback = () => {}

    let in_slot = node.findInputSlot(name)
    let out_slot = node.findOutputSlot(name)

    if (in_slot === -1) {
      console.error("no input slot")
      node.addInput(name, type)
      in_slot = node.findInputSlot(name)
    }

    if (out_slot === -1) {
      console.error("no output slot")
      node.addOutput(name, type)
      out_slot = node.findOutputSlot(name)
    }

    this.in_slot = in_slot
    this.out_slot = out_slot

    if (DandyChain.debug_blobs) {
      this.urls_widget = ComfyWidgets.STRING(node, "urls", ["", {default:"", multiline: true}], app)
      this.urls_widget.serialize = false
    }

    // it seems we need to actually connect them before knowing if there's loops
    // this doesn't work
    node.onConnectInput = () => {
      console.log("connect ipnut")
      let loops_detected = false
      const nop = (x) => {}
      const seen = []
      const on_loop_detected = () => { 
        console.error("WEEEEEEEEEEEEEE")
        loops_detected = true 
      }
      console.log("snerbs")
      this.follow_chain(nop, seen, on_loop_detected)
      console.log("snorbs", loops_detected)
      return !loops_detected
    }

    node.onConnectionsChange = (type, index, connected, link_info) => {
      const seen = []
      const on_loop_detected = () => { 
        console.error("boooo")
      }
      this.follow_chain((chain) => {
        chain.update_data()
      }, seen, on_loop_detected)
    }
  }

  // f_each_node: (chain) => {}
  follow_chain(f_each_node, seen = [], on_loop_detected = () => {}) {
    const { node, out_slot, type } = this
    const { graph, outputs } = node
    const output = outputs[out_slot]
    const { links } = output
    
    f_each_node(this)

    if (links === null || links.length === 0) {
      // we've reached the end
      return
    }

    let loopy = false
    links.forEach( (link_id) => {
      if (loopy) {
        return
      }
      const link = graph.links[link_id]
      if (link === undefined) {
        // node was likely removed and that's why we're firing
        return
      }

      const { target_id } = link
      
      seen.forEach( (seen_target_id) => {
        if (seen_target_id === target_id) {
          loopy = true
        }
      })
      if (loopy) {
        console.error("loop found")
        on_loop_detected()
        return
      }
      const seen_prime = seen.concat([target_id])

      const target_node = graph.getNodeById(link.target_id)
      if (target_node) {
        const target_dandy = target_node.dandy
        if (target_dandy) {
          const target_chain = target_dandy.chains[type]
          target_chain.follow_chain(f_each_node, seen_prime, on_loop_detected)
        }
      }
    })
  }

  update_chain() {
    this.follow_chain((chain) => {
      chain.update_data()
    })
  }

  update_data() {
    const { in_slot, out_slot, node, contributions, dandy, type } = this

    let out_urls = ""
    if (node.isInputConnected(in_slot)) {
      const force_update = false
      const in_urls = node.getInputData(in_slot, force_update)
      if (in_urls) {
        out_urls += `${in_urls}\n`
      }
    }

    out_urls += contributions
    node.setOutputData(out_slot, out_urls)
    node.triggerSlot(out_slot)

    this.widget.value = out_urls

    if (DandyChain.debug_blobs) {
      this.urls_widget.widget.element.value = out_urls
    }

    if (dandy.on_chain_updated) {
      dandy.on_chain_updated(type)
    }
  }
}

// ==========================================================================================
export class DandyJsChain extends DandyChain {

  constructor(dandy, node, app) {
    super(dandy, node, app, JS_NAME, JS_TYPE)
    console.log("JS Chain constructed", this)
  }

}