import { DandyNames, DandyTypes, type_is_dandy, Mimes, 
  DandyInvisibleWidget, DandyWidget, ComfyTypes, 
  ComfyTypesList} from "/extensions/dandy/dandymisc.js"
import { ComfyWidgets } from "/scripts/widgets.js"
import { DandyChainData } from '/extensions/dandy/chain_data.js'

const N = DandyNames
const T = DandyTypes
const M = Mimes

export class DandyChain {
  static debug_blobs = false
  static debug_verbose = false

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
    this.data = []
    this.key = `${n_inputs}:${type}:${n_outputs}`
    this.is_mutating_io = false

    const { node, app } = this

    if (dandy.chains === undefined) {
      dandy.chains = {}
    }
    const { chains } = dandy
    if (chains[type] === undefined) {
      chains[type] = []
    }
    chains[type].push(this)

    this._contributions = null
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

  // please note the terminology:
  // is_start / is_end  = explicit chain termination (0 inputs / 0 outputs)
  // is_first / is_last = actual first / last dandy node in the connected chain (discovered by walking)

  get is_start() {
    return this.in_slots.length === 0
  }

  get is_end() {
    return this.out_slots.length === 0
  }

  get is_first() {
    return find_first() === this
  }

  get is_last() {
    return find_last() === this
  }

  find_first() {
    let first = null
    this.follow_chain_backwards((chain) => {
      first = chain
    })
    return first
  }

  find_last() {
    let last = null
    this.follow_chain((chain) => {
      last = chain
    })
    return last
  }

  get n_inputs() {
    return this._n_inputs
  }

  get n_outputs() {
    return this._n_outputs
  }
  
  set n_inputs(n_inputs) {
    const { dandy, node, name, type, in_slots, input_widgets } = this
    this.is_mutating_io = true
    
    this.debug_log("Setting n_inputs", n_inputs )
    this.each_input((nom, i) => {
      const w = input_widgets[i]
      if (w) {
        w.callback = () => {}
      }
    })
    in_slots.length = 0
    input_widgets.length = 0
    this._n_inputs = n_inputs
    
    // in and out chains exists simultaneously, ignore the case of 0 
    if (n_inputs > 0) {
      if (n_inputs === 1) {
        dandy.rename_input_slot(`${name}0`, name)
      } else {
        dandy.rename_input_slot(name, `${name}0`)
      }
      dandy.each_io_name(name, n_inputs, (nom, i) => {
        dandy.put_input_slot(nom, type)
      })   
      dandy.remove_inputs_after(n_inputs, name)
      //dandy.remove_inputs_and_widgets(name)
    }

    this.each_input((nom, i) => {
      const widget = new DandyInvisibleWidget(node, nom, type)
      widget.value = ''
      input_widgets.push(widget)
      this.debug_log("PUSHING")
      in_slots.push(dandy.put_input_slot(nom, type))
    })

    this.is_mutating_io = false
    this.update_chain()
  }

  set n_outputs(n_outputs) {
    const { out_slots, dandy, name, type } = this
    this.is_mutating_io = true
    this._n_outputs = n_outputs
    out_slots.length = 0
    
    // in and out chains exists simultaneously, ignore the case of 0 
    if (n_outputs > 0) {
      if (n_outputs === 1) {
        dandy.rename_output_slot(`${name}0`, name)
      } else {
        dandy.rename_output_slot(name, `${name}0`)
      }
      dandy.each_io_name(name, n_outputs, (nom, i) => {
        dandy.put_output_slot(nom, type)
      })
      dandy.remove_outputs_after(n_outputs, name)

      this.each_output((nom, i) => {
        out_slots.push(dandy.put_output_slot(nom, type))
      })

      this.is_mutating_io = false
      this.update_chain()

    }
  }

  each_input(f) {
    const { n_inputs, name, dandy } = this
    dandy.each_io_name(name, n_inputs, f)
  }

  each_output(f) {
    const { name, n_outputs, dandy } = this
    dandy.each_io_name(name, n_outputs, f)
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
        // we've reached the end or last
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

  // f_each_node: (chain) => {}
  follow_chain_backwards(f_each_node, seen = [], on_loop_detected = () => {}) {
    const { node, in_slots, type } = this
    const { graph, inputs } = node

    f_each_node(this)

    this.each_input((nom, i) => {
      const in_slot = in_slots[i]
      if (!(in_slot > -1)) {
        return
      }
      const input = inputs[in_slot]
      if (!input) {
        return
      }
      
      let loopy = false
      
      // inputs don't include a links porperty so we have to search the graph
      Object.values(node.graph.links).forEach((link) => {
        // is the link pointing to me?
        if (link && link.target_id === node.id && link.target_slot === in_slot) {
          const { origin_id } = link

          seen.forEach( (seen_origin_id) => {
            if (seen_origin_id === origin_id) {
              loopy = true
            }
          })
          if (loopy) {
            this.error_log('loop found')
            on_loop_detected()
            return
          }
          const seen_prime = seen.concat([origin_id])
          
          const origin_node = graph.getNodeById(link.origin_id)
          if (origin_node) {
            const origin_dandy = origin_node.dandy
            // we might be connected to a non-dandy input, like 'STRING'
            if (origin_dandy) {
              const origin_chains = origin_dandy.chains[type]
              if (origin_chains) {
                origin_chains.forEach((origin_chain) => {
                  // don't follow a new chain
                  // 
                  // some nodes (DandyLand) have both start and end to the same chain type, 
                  // but they are separate chains, this is just looking at the chains by type, so we
                  // are careful not to assume that since there's an input on this node of this type,
                  // that it is our chain, it might not be 
                  if (!origin_chain.is_end) {
                    origin_chain.follow_chain_backwards(f_each_node, seen_prime, on_loop_detected)
                  }
                })
              }
            }
          }
        }
      })
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
    if (!this.dandy.graph_is_configuring && !this.is_mutating_io) {
      this.follow_chain((chain) => {
        chain.update_data()
      })
    }
  }

  update_data(using_this_input = false) {
    const { node, _contributions, mime, dandy, type, data, input_widgets, 
      in_slots, out_slots, n_outputs } = this
    const { graph } = node

    if (!graph || graph.is_loading) {
      return
    }

    this.debug_log("update_data, clearing cat data")
    data.length = 0

    if (using_this_input === false) {
      const get_in_data = (in_slot) => {
        this.debug_log("get_in_data :: in_slot", in_slot, "isconnected", node.isInputConnected(in_slot))
        if (in_slot !== null && node.isInputConnected(in_slot)) {
          const force_update = true
          return node.getInputData(in_slot, force_update)
        }
        return null
      }
      
      this.debug_log("before each")
      this.each_input((input_name, i) => {
        this.debug_log(`each :: ${input_name}, ${i}, ${in_slots.length}, ${in_slots[i]}`)
        const input_widget = input_widgets[i]
        const in_slot = in_slots[i]
        const in_data = get_in_data(in_slot)
        if (in_data) {
          const f = (x) => {
            const o = DandyChainData.wrap_if_needed(x, mime, type)
            data.push(o)
          }
          if (Array.isArray(in_data)) {
            this.debug_log("array input :: ", in_data)
            in_data.forEach(f)
          }
          else {
            f(in_data)
          }
          this.debug_log(`Setting widget ${input_name}`, in_data, JSON.stringify(in_data))
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
    const contributions = []
    if (contributions_raw === undefined || contributions_raw === null) {
      // skip it
    }
    else if (Array.isArray(contributions_raw)) {
      contributions_raw.forEach((contribution) => {
        contributions.push(DandyChainData.wrap_if_needed(contribution, mime, type))
      })
    }
    else if (type === DandyTypes.IMAGE_URL) {
      //this.debug_log("UPDATE DATA IMAGE_URLS", )
      let s = contributions_raw
      if (s.is_dandy_chain_data) {
        s = contributions_raw.value
      }
      s.split('\n').forEach((url) => {
        contributions.push(new DandyChainData(url, mime, type))
      })
    }
    else {
      contributions.push(DandyChainData.wrap_if_needed(contributions_raw, mime, type))
    }

    contributions.forEach((contribution) => {
      data.push(contribution)
    }) 
    
    // we concat strings by default, but not always (StringArrayCollector, DandyTown)
    if (type === ComfyTypes.STRING && dandy.concat_string_inputs) {
      let s = ''
      data.forEach((o) => {
        s += `${o.value}`
      })
      data.length = 0
      data.push(new DandyChainData(s, mime, type))
    }
    
    if (n_outputs > 1) {
      const n = Math.min(n_outputs, data.length)
      this.each_output((output_name, i) => {
        const j = i % n
        const out_slot = out_slots[i]
        if (out_slot > -1) {
          this.debug_log("Setting output, multiple outputs", out_slot, data[j], data)
          node.setOutputData(out_slot, data[j])
          node.triggerSlot(out_slot)
        }
      })
    } else {
      this.each_output((output_name, i) => {
        const out_slot = out_slots[i]
        if (out_slot > -1) {
          this.debug_log("Setting output", out_slot, data)
          node.setOutputData(out_slot, data)
          node.triggerSlot(out_slot)
        }
      })
    }
        
    if (DandyChain.debug_blobs) {
      this.debug_blobs_widget.widget.element.value = data.map((x) => x.json).join('\n')
    }
    
    if (dandy.on_chain_updated) {
      // this.debug_log(`${dandy.constructor.name}.on_chain_updated(${this.constructor.name})`)
      dandy.on_chain_updated(this)
    }

    this.debug_log("update_data end – data:", data.map(c => c.value))
  }

  get values() {
    return this.data.map((x) => x.value)
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
export class DandyStringChain extends DandyChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, 'string', 'STRING', M.STRING, n_inputs, n_outputs)
  }
}

export class DandyIntChain extends DandyChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, 'int', 'INT', M.VALUE, n_inputs, n_outputs)
  }
}

export class DandyFloatChain extends DandyChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, 'float', 'FLOAT', M.VALUE, n_inputs, n_outputs)
  }
}

export class DandyBooleanChain extends DandyChain {
  constructor(dandy, n_inputs, n_outputs) {
    super(dandy, 'boolean', 'BOOLEAN', M.VALUE, n_inputs, n_outputs)
  }
}