import { DandyNames, DandyTypes, type_is_dandy, Mimes, 
  DandyInvisibleWidget, DandyWidget, ComfyTypes, 
  ComfyTypesList} from "/extensions/dandy/dandymisc.js"
import { ComfyWidgets } from "/scripts/widgets.js"

const N = DandyNames
const T = DandyTypes
const M = Mimes

export class DandyChainData {
  static from_json(s) {
    const o = JSON.parse(s)
    if (o === undefined) {
      return o
    }
    return new DandyChainData(o.value. o.mime, o.type)
  }

  static wrap_if_needed(o, mime, type) {
    const x = o.is_dandy_chain_data ? o : new DandyChainData(o, mime, type)
    return x
  }

  constructor(value, mime, type) {
    this.value = value
    this.mime = mime
    this.type = type
    this.is_dandy_chain_data = true
  }

  get json() {
    const { value, mime, type, is_dandy_chain_data } = this
    return JSON.stringify({ value, mime, type, is_dandy_chain_data })
  }
}

export class DandyChain {
  static debug_blobs = false
  static debug_verbose = true

  debug_log(s, ...more) {
    if (DandyChain.debug_verbose) {
      console.log(`${this.dandy.constructor.name}.chain<${this.type}> :: ${s}`, ...more)
    }
  }

  log(s, ...more) {
    console.log(`${this.dandy.constructor.name}.chain<${this.type}> :: ${s}`, ...more)
  }

  warn_log(s, ...more) {
    console.warn(`${this.dandy.constructor.name}.chain<${this.type}> :: ${s}`, ...more)
  }

  error_log(s, ...more) {
    console.error(`${this.dandy.constructor.name}.chain<${this.type}> :: ${s}`, ...more)
  }
  
  constructor(dandy, name, type, mime, n_inputs, n_outputs) {
    this.dandy = dandy
    this.node = dandy.node
    this.app = dandy.app
    this.name = name
    this.type = type
    this.in_slots = []
    this.out_slots = []
    this.input_widgets = [] 
    this.cat_data = []
    this.key = `${n_inputs}:${type}:${n_outputs}`

    const { node, app } = this

    if (dandy.chains === undefined) {
      dandy.chains = {}
    }
    const { chains } = dandy
    if (chains[type] === undefined) {
      chains[type] = []
    }
    chains[type].push(this)

    this._contributions = ''
    this._mime = mime

    // these are setters
    this.n_inputs = n_inputs
    this.n_outputs = n_outputs

    if (DandyChain.debug_blobs) {
      this.debug_blobs_widget = ComfyWidgets.STRING(node, 'debug_blobs', ['', {
        default:'', multiline: true, serialize: false}], app)
    }

    if (dandy.init_after_chain) {
      dandy.init_after_chain()
    }

  }

  get is_start() {
    return this.n_inputs === 0
  }

  get is_end() {
    return this.n_outputs === 0
  }

  get n_inputs() {
    return this._n_inputs
  }

  get n_outputs() {
    return this._n_outputs
  }
  
  set n_inputs(n_inputs) {
    const { dandy, node, name, type, in_slots, input_widgets } = this
    
    this.each_input((nom, i) => {
      const w = input_widgets[i]
      if (w) {
        w.callback = () => {}
      }
    })
    in_slots.length = 0
    input_widgets.length = 0
    this._n_inputs = n_inputs
    
    // if (n_inputs >= 1) {
      dandy.remove_inputs_and_widgets(name)
    // }

    this.each_input((nom, i) => {
      const widget = new DandyInvisibleWidget(node, nom, type)
      widget.value = ''
      input_widgets.push(widget)
      in_slots.push(dandy.put_input_slot(nom, type))
    })
  }

  set n_outputs(n_outputs) {
    const { out_slots, dandy, name, type } = this
    this._n_outputs = n_outputs
    
    if (!type_is_dandy(type)) {
      dandy.remove_outputs(name)
    }
    out_slots.length = 0
    this.each_output((nom, i) => {
      out_slots.push(dandy.put_output_slot(nom, type))
    })
  }

  get is_start() {
    return this.in_slots.length === 0
  }

  each_input(f) {
    const { n_inputs, name } = this
    for (let i = 0; i < n_inputs; ++i) {
      const nom = n_inputs === 1 ? name : `${name}${i}`
      f(nom, i)
    }
  }

  each_output(f) {
    const { name, n_outputs } = this
    for (let i = 0; i < n_outputs; ++i) {
      const nom = n_outputs === 1 ? name : `${name}${i}`
      f(nom, i)
    }
  }

  reconnect_input_connections(links_table) {
    const {graph } = this.node
    this.each_input((input_name, i) => {
      this.debug_log('reconnect_input_connections', i)
      const links_row = links_table[i]
      this.debug_log('reconnect_input_connections links row', i, links_row)

      if (links_row) {
        links_row.forEach((link) => {
          const { origin_id, origin_slot, target_id, target_slot } = link
          this.debug_log('reconnect_input_connections', i, origin_id, origin_slot, target_id, target_slot)

          const origin = graph.getNodeById(origin_id)
          origin.connect(origin_slot, target_id, target_slot) 
        })
      }
    })
  }

  reconnect_output_connections(links_table) {
    const { node } = this
    this.each_output((output_name, i) => {
      const links_row = links_table[i]
      if (links_row) {
        links_row.forEach((link) => {
          const { target_id, target_slot } = link
          node.connect(output_name, target_id, target_slot) 
        })
      }
    })
  }


  // f_each_node: (chain) => {}
  follow_chain(f_each_node, seen = [], on_loop_detected = () => {}) {
    const { node, out_slots, type } = this
    const { graph, outputs } = node

    f_each_node(this)

    this.each_output((nom, i) => {
      const out_slot = out_slots[i]
      if (!(out_slot > -1)) {
        return
      }
      const output = outputs[out_slot]
      if (!output) {
        return
      }
      const { links } = output
      if (links === null || links.length === 0) {
        // we've reached the end
        return
      }
  
      let loopy = false
      for (let i = 0; i < links.length; ++i) {
        const link_id = links[i]
      
        if (loopy) {
          this.error_log('loop found')
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
          this.error_log('loop found')
          on_loop_detected()
          return
        }
        const seen_prime = seen.concat([target_id])
        
        const target_node = graph.getNodeById(link.target_id)
        if (target_node) {
          const target_dandy = target_node.dandy
          // we might be connected to a non-dandy input, like 'STRING'
          if (target_dandy) {
            const target_chains = target_dandy.chains[type]
            if (target_chains) {
              target_chains.forEach((target_chain) => {
                // don't follow a new chain
                if (!target_chain.is_start) {
                  target_chain.follow_chain(f_each_node, seen_prime, on_loop_detected)
                }
              })
            }
          }
        }
      }
    })
  }

  set contributions(v) {
    this._contributions = v
    this.update_chain()
  }

  set mime(v) {
    this._mime = v
    this.update_chain()
  }

  get mime() {
    return this._mime
  }

  output_update_ignoring_input(value) {
    this.debug_log("output_update_ignoring_input")
    const seen = []
    const on_loop_detected = () => {}
    let using_this_input = value

    this.follow_chain((chain) => {
      chain.update_data(using_this_input)
      using_this_input = false
    }, seen, on_loop_detected)
  }

  update_chain() {
    this.follow_chain((chain) => {
      chain.update_data()
    })
  }

  update_data(using_this_input = false) {
    const { node, _contributions, mime, dandy, type, cat_data, input_widgets, 
      in_slots, out_slots, n_outputs } = this

    cat_data.length = 0

    if (using_this_input === false) {
      const get_in_data = (in_slot) => {
        if (in_slot !== null && node.isInputConnected(in_slot)) {
          const force_update = false
          return node.getInputData(in_slot, force_update)
        }
        return null
      }

      this.each_input((input_name, i) => {
        const input_widget = input_widgets[i]
        const in_slot = in_slots[i]
        const in_data = get_in_data(in_slot)

        if (in_data) {
          const f = (x) => {
            const o = DandyChainData.wrap_if_needed(x, mime, type)
            cat_data.push(o)
          }
          if (Array.isArray(in_data)) {
            in_data.forEach(f)
          }
          else {
            f(in_data)
          }
          //this.debug_log(`Setting widget ${input_name}`, in_data, JSON.stringify(in_data))
          input_widget.value = JSON.stringify(in_data)
        }
        else {
          if (input_widget) {
            input_widget.value = ''
          }
        }
      })
    }

    const contributions_raw = using_this_input ? using_this_input : _contributions
    const contributions = DandyChainData.wrap_if_needed(contributions_raw, mime, type)
    
    //this.debug_log("my contributions", contributions)
    if (type in ComfyTypesList) {
      cat_data.push(contributions)
    }
    else if (type === DandyTypes.IMAGE_URL) {
      contributions.value.split('\n').forEach((url) => {
      cat_data.push(make_data(url))
      })
    }
    else {
      cat_data.push(contributions)
    }
    
    if (n_outputs > 1) {
      const n = Math.min(n_outputs, cat_data.length)
      this.each_output((output_name, i) => {
        const j = i % n
        const out_slot = out_slots[i]
        if (out_slot) {
          //this.debug_log("Setting output, multiple outputs", out_slot, cat_data[j])
          node.setOutputData(out_slot, cat_data[j])
          node.triggerSlot(out_slot)
        }
      })
    } else {
      this.each_output((output_name, i) => {
        const out_slot = out_slots[i]
        if (out_slot) {
          //this.debug_log("Setting output", out_slot, cat_data)
          node.setOutputData(out_slot, cat_data)
          node.triggerSlot(out_slot)
        }
      })
    }
        
    if (DandyChain.debug_blobs) {
      this.debug_blobs_widget.widget.element.value = cat_data.map((x) => x.json).join('\n')
    }
    
    if (dandy.on_chain_updated) {
      // this.debug_log(`${dandy.constructor.name}.on_chain_updated(${this.constructor.name})`)
      dandy.on_chain_updated(this)
    }
  }

  get data() {
    const { cat_data } = this 
    const no_fakes = (x) => {
      const { value } = x
      return value !== undefined && value !== '' && value.length > 0
    }
    return cat_data.filter(no_fakes)
  }
}

// ==========================================================================================
export class DandyJsChain extends DandyChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, N.JS, T.JS, M.JS, n_inputs, n_outputs)
  }
}

export class DandyHtmlChain extends DandyChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, N.HTML, T.HTML, M.HTML, n_inputs, n_outputs)
  }
}

export class DandyCssChain extends DandyChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, N.CSS, T.CSS, M.CSS, n_inputs, n_outputs)
  }
}

export class DandyJsonChain extends DandyChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, N.JSON, T.JSON, M.JSON, n_inputs, n_outputs)
  }
}

export class DandyYamlChain extends DandyChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, N.YAML, T.YAML, M.YAML, n_inputs, n_outputs)
  }
}

export class DandyWasmChain extends DandyChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, N.WASM, T.WASM, M.WASM, n_inputs, n_outputs)
  }
}

export class DandyImageUrlChain extends DandyChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, N.IMAGE_URL, T.IMAGE_URL, M.PNG, n_inputs, n_outputs)
  }
}
// --------------------------------------------------------------------------
export class DandyPrimativeChain extends DandyChain {
  constructor(dandy, name, type, mime, n_inputs, n_outputs) {
    super(dandy, name, type, mime, n_inputs, n_outputs)
  }
}

export class DandyStringChain extends DandyPrimativeChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, 'string', 'STRING', M.STRING, n_inputs, n_outputs)
  }
}

export class DandyIntChain extends DandyPrimativeChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, 'int', 'INT', M.VALUE, n_inputs, n_outputs)
  }
}

export class DandyFloatChain extends DandyPrimativeChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, 'float', 'FLOAT', M.VALUE, n_inputs, n_outputs)
  }
}

export class DandyBooleanChain extends DandyPrimativeChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, 'boolean', 'BOOLEAN', M.VALUE, n_inputs, n_outputs)
  }
}