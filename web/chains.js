import { DandyNames, DandyTypes } from "/extensions/dandy/dandymisc.js"
import { ComfyWidgets } from "/scripts/widgets.js"

const N = DandyNames
const T = DandyTypes

export class DandyChain {
  static debug_blobs = false

  constructor(dandy, name, type) {
    this.dandy = dandy
    this.node = dandy.node
    this.app = dandy.app
    this.name = name
    this.type = type
    const { node, app } = this

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

    this.in_slot = dandy.put_input_slot(name, type)
    this.out_slot = dandy.put_output_slot(name, type)

    if (DandyChain.debug_blobs) {
      this.debug_blobs_widget = ComfyWidgets.STRING(node, 'debug_blobs', ['', {
        default:'', multiline: true, serialize: false}], app)
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
    for (let i = 0; i < links.length; ++i) {
      const link_id = links[i]
    
      if (loopy) {
        console.error("loop found")
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
        console.error('loop found')
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
    }
  }

  update_chain() {
    this.follow_chain((chain) => {
      chain.update_data()
    })
  }

  update_data() {
    const { in_slot, out_slot, node, contributions, dandy, type } = this

    let out_data = ''
    if (node.isInputConnected(in_slot)) {
      const force_update = false
      const in_data = node.getInputData(in_slot, force_update)
      if (in_data) {
        out_data += `${in_data}\n`
      }
    }

    out_data += contributions
    node.setOutputData(out_slot, out_data)
    node.triggerSlot(out_slot)

    this.widget.value = out_data

    if (DandyChain.debug_blobs) {
      this.debug_blobs_widget.widget.element.value = out_data.split('\n').map((x) => {
        const p = x.length - 50
        const q = x.length
        return x.slice(p, q)
      }).join('\n')
    }

    if (dandy.on_chain_updated) {
      dandy.on_chain_updated(type)
    }
  }

  get data() {
    const no_fakes = (datum) => datum !== 'undefined' && datum.length > 0
    //console.log(`chain<${this.type}>: ${this.widget.value}`)
    return this.widget.value.split('\n').filter(no_fakes)
  }
}

// ==========================================================================================
export class DandyJsChain extends DandyChain {
  constructor(dandy) {
    super(dandy, N.JS, T.JS)
  }
}

export class DandyHtmlChain extends DandyChain {
  constructor(dandy) {
    super(dandy, N.HTML, T.HTML)
  }
}

export class DandyCssChain extends DandyChain {
  constructor(dandy) {
    super(dandy, N.CSS, T.CSS)
  }
}

export class DandyJsonChain extends DandyChain {
  constructor(dandy) {
    super(dandy, N.JSON, T.JSON)
  }
}

export class DandyYamlChain extends DandyChain {
  constructor(dandy) {
    super(dandy, N.YAML, T.YAML)
  }
}

export class DandyWasmChain extends DandyChain {
  constructor(dandy) {
    super(dandy, N.WASM, T.WASM)
  }
}

export class DandyB64ImagesChain extends DandyChain {
  constructor(dandy) {
    super(dandy, N.B64IMAGES, T.B64IMAGES)
  }
}

export class DandyB64MasksChain extends DandyChain {
  constructor(dandy) {
    super(dandy, N.B64MASKS, T.B64MASKS)
  }
}
