
const JS_TYPE = 'JS_URLS'
const JS_NAME = 'js'

// ==========================================================================================
export class DandyJsChain {
  static debug_blobs = false

  constructor(dandy, node, app) {
    this.dandy = dandy
    this.node = node
    this.app = app
    this.js_urls = ''  // current node will put their contributions here
    this.out_urls = '' // all the collected urls

    let in_slot = node.findInputSlot(JS_NAME)
    let out_slot = node.findOutputSlot(JS_NAME)

    if (in_slot === -1) {
      node.addInput(JS_NAME, JS_TYPE)
      in_slot = node.findInputSlot(JS_NAME)
    }

    if (out_slot === -1) {
      node.addOutput(JS_NAME, JS_TYPE)
      out_slot = node.findOutputSlot(JS_NAME)
    }

    this.in_slot_javascript = in_slot
    this.out_slot_javascript = out_slot

    if (DandyJsChain.debug_blobs) {
      this.urls_widget = ComfyWidgets.STRING(node, "urls", ["", {default:"", multiline: true}], app)
      this.urls_widget.serialize = false
    }

    node.onConnectionsChange = (type, index, connected, link_info) => {
      this.follow_js_chain((js_chain) => {
        js_chain.update_js()
      })
    }
  }

  // f_each_node: (js_chain) => {}
  follow_js_chain(f_each_node, seen = []) {
    const { node, out_slot_javascript } = this
    const { graph, outputs } = node
    const output = outputs[out_slot_javascript]
    const { links } = output
    
    f_each_node(this)

    if (links === null || links.length === 0) {
      // we've reached the end
      return
    }

    links.forEach( (link_id) => {
      const link = graph.links[link_id]
      if (link === undefined) {
        // node was likely removed and that's why we're firing
        return
      }

      const { target_id } = link
      
      let loopy = false
      seen.forEach( (seen_target_id) => {
        if (seen_target_id === target_id) {
          loopy = true
        }
      })
      if (loopy) {
        console.error("loop in graph, bailing")
        return
      }
      const seen_prime = seen.concat([target_id])

      const target_node = graph.getNodeById(link.target_id)
      if (target_node) {
        const target_dandy = target_node.dandy
        if (target_dandy) {
          const target_chain = target_dandy.js_chain
          target_chain.follow_js_chain(f_each_node, seen_prime)
        }
      }
    })
  }

  update_chain() {
    this.follow_js_chain((js_chain) => {
      js_chain.update_js()
    })
  }

  update_js() {
    const { in_slot_javascript, out_slot_javascript, node, js_urls, dandy } = this

    let out_urls = ""
    if (node.isInputConnected(in_slot_javascript)) {
      const force_update = false
      const in_urls = node.getInputData(in_slot_javascript, force_update)
      if (in_urls) {
        out_urls += `${in_urls}\n`
      }
    }

    out_urls += js_urls
    node.setOutputData(out_slot_javascript, out_urls)
    node.triggerSlot(out_slot_javascript)

    this.out_urls = out_urls

    if (DandyJsChain.debug_blobs) {
      this.urls_widget.widget.element.value = out_urls
    }

    if (dandy.on_js_updated) {
      dandy.on_js_updated()
    }
  }
}
