import { DandyNames, DandyTypes, Mimes, DandyWidget } from "/extensions/dandy/dandymisc.js"
import { ComfyWidgets } from "/scripts/widgets.js"

const N = DandyNames
const T = DandyTypes
const M = Mimes

export const IO = {
  IN: 'in_only',
  OUT: 'out_only',
  IN_OUT: 'in_out',
  IN_SPLIT_OUT: 'in_split_out',
}

export class DandyChain {
  static debug_blobs = false

  constructor(dandy, name, type, mime, io_config) {
    this.dandy = dandy
    this.node = dandy.node
    this.app = dandy.app
    this.name = name
    this.type = type
    this.io_config = io_config
    const { node, app } = this

    if (dandy.chains === undefined) {
      dandy.chains = {}
    }
    dandy.chains[type] = this

    this._contributions = ''
    this._mime = mime

    const widget = node.widgets.find((x) => x.name === name)
    this.widget = widget
    widget.value = ''
    widget.size = [0, -4] // litegraph will pad it by 4
    widget.callback = () => {}

    this.split_chain = false
    if (io_config === IO.IN) {
      dandy.remove_output_slot(name)
      this.in_slot = dandy.put_input_slot(name, type)
      this.out_slot = null
    }

    else if (io_config === IO.OUT) {
      dandy.remove_input_slot(name)
      this.in_slot = null
      this.out_slot = dandy.put_output_slot(name, type)
    }
    
    else if (io_config === IO.IN_OUT) {
      this.in_slot = dandy.put_input_slot(name, type)
      this.out_slot = dandy.put_output_slot(name, type)
    }

    else if (io_config === IO.IN_SPLIT_OUT) {
      this.split_chain = true
      this.in_slot = dandy.put_input_slot(name, type)
      this.out_slot = dandy.put_output_slot(name, type)
    }
    
    if (DandyChain.debug_blobs) {
      this.debug_blobs_widget = ComfyWidgets.STRING(node, 'debug_blobs', ['', {
        default:'', multiline: true, serialize: false}], app)
    }

  }

  // f_each_node: (chain) => {}
  follow_chain(f_each_node, seen = [], on_loop_detected = () => {}, go_passed_split = false) {
    const { node, out_slot, type, split_chain } = this
    const { graph, outputs } = node

    //console.log(`chain<${type}>:f_each_node(this)`)
    f_each_node(this)

    if (split_chain && !go_passed_split) {
      console.log(`chain<${type}>:stopping propagation`)
      return
    }
    
    const output = outputs[out_slot]
    if (output === undefined) {
      // we've reached the end
      // console.log(`chain<${type}>:reached end with no out slot`)

      return    
    }

    const { links } = output
    if (links === null || links.length === 0) {
      // we've reached the end
      // console.log(`chain<${type}>:reached end with no links, maybe reload your nodes`, links, output)

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
        // console.log(`chain<${type}>:undefined link`)
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
        // we might be connected to a non-dandy input, like 'STRING'
        if (target_dandy) {
          const target_chain = target_dandy.chains[type]
          const stop_at_split = false
          target_chain.follow_chain(f_each_node, seen_prime, on_loop_detected, stop_at_split)
        }
      }
    }
  }

  get is_start() {
    const { node, in_slot } = this
    if (in_slot === null) {
      return true  
    }
    return !node.isInputConnected(in_slot)
  }

  set contributions(v) {
    this._contributions = v
    this.update_chain()
  }

  set mime(v) {
    this._mime = v
    this.update_chain()
  }

  split_chain_output_update(value) {
    const seen = []
    const on_loop_detected = () => {}
    const go_passed_split = true
    let outputting_from_split_chain = value
    this.follow_chain((chain) => {
      chain.update_data(outputting_from_split_chain)
      outputting_from_split_chain = false
    }, seen, on_loop_detected, go_passed_split)
  }

  update_chain() {
    this.follow_chain((chain) => {
      chain.update_data()
    })
  }

  update_data(outputting_from_split_chain = false) {
    const { in_slot, out_slot, node, _contributions, _mime, dandy, type } = this
    let out_data = ''
    if (outputting_from_split_chain === false) {
      if (in_slot !== null && node.isInputConnected(in_slot)) {
        const force_update = false
        const in_data = node.getInputData(in_slot, force_update)
  
        if (in_data) {
          out_data += `${in_data}\n`
        }
      }
    }

    const contributions = outputting_from_split_chain ? outputting_from_split_chain : _contributions
    out_data += JSON.stringify({ value: contributions, mime: _mime })
    if (out_slot !== null) {
      node.setOutputData(out_slot, out_data)
      node.triggerSlot(out_slot)
    }

    this.widget.value = out_data

    if (DandyChain.debug_blobs) {
      this.debug_blobs_widget.widget.element.value = out_data.split('\n').map((x) => {
        const p = x.length - 100
        const q = x.length
        return x.slice(p, q)
      }).join('\n')
    }

    if (outputting_from_split_chain === false) {
      if (dandy.on_chain_updated) {
        dandy.on_chain_updated(type)
      }
    }
  }

  get data() {
    const no_fakes = (x) => x !== 'undefined' && x.length > 0
    //console.log(`chain<${this.type}>: ${this.widget.value}`)
    const a = this.widget.value.split('\n').filter(no_fakes)
    const z = a.map((x) => JSON.parse(x)).filter((x) => no_fakes(x.value))
    console.warn(`DandyChain<${this.type}>.data:`, z)
    return z
  }
}

// ==========================================================================================
export class DandyJsChain extends DandyChain {
  constructor(dandy, io_config) {
    super(dandy, N.JS, T.JS, M.JS, io_config)
  }
}

export class DandyHtmlChain extends DandyChain {
  constructor(dandy, io_config) {
    super(dandy, N.HTML, T.HTML, M.HTML, io_config)
  }
}

export class DandyCssChain extends DandyChain {
  constructor(dandy, io_config) {
    super(dandy, N.CSS, T.CSS, M.CSS, io_config)
  }
}

export class DandyJsonChain extends DandyChain {
  constructor(dandy, io_config) {
    super(dandy, N.JSON, T.JSON, M.JSON, io_config)
  }
}

export class DandyYamlChain extends DandyChain {
  constructor(dandy, io_config) {
    super(dandy, N.YAML, T.YAML, M.YAML, io_config)
  }
}

export class DandyWasmChain extends DandyChain {
  constructor(dandy, io_config) {
    super(dandy, N.WASM, T.WASM, M.WASM, io_config)
  }
}

export class DandyImageUrlChain extends DandyChain {
  constructor(dandy, io_config) {
    super(dandy, N.IMAGE_URL, T.IMAGE_URL, M.PNG, io_config)
  }
}

export class DandyStringChain extends DandyChain {
  constructor(dandy, io_config) {
    const { node, app } = dandy
    const name = 'string'
    dandy.remove_io_and_widgets(name)
    new DandyWidget(node, name, '', app)
    super(dandy, 'string', 'STRING', M.STRING, io_config)
  }
}