import { DandyNames, DandyTypes, type_is_dandy, Mimes, DandyInvisibleWidget } from "/extensions/dandy/dandymisc.js"
import { ComfyWidgets } from "/scripts/widgets.js"

const N = DandyNames
const T = DandyTypes
const M = Mimes

export const IO = {
  IN: '1:in_only:0',
  OUT: '0:out_only:1',
  IN_OUT: '1:in_out:1',
  IN_SPLIT_OUT: '1:in_split_out:1',
  N_IN_OUT: (n_inputs) => `${n_inputs}:n_in_out:1`,
}

export class DandyChain {
  static debug_blobs = false
  static debug_verbose = true

  debug_log(s, ...more) {
    if (DandyChain.debug_verbose) {
      console.log(`${this.dandy.constructor.name}.chain<${this.type}> :: ${s}`, ...more)
    }
  }

  warn_log(s, ...more) {
    console.warn(`${this.dandy.constructor.name}.chain<${this.type}> :: ${s}`, ...more)
  }

  error_log(s, ...more) {
    console.error(`${this.dandy.constructor.name}.chain<${this.type}> :: ${s}`, ...more)
  }
  
  constructor(dandy, name, type, mime, io_config) {
    this.dandy = dandy
    this.node = dandy.node
    this.app = dandy.app
    this.name = name
    this.type = type
    this.io_config = io_config
    this.in_slots = []
    this.out_slots = []
    this.input_widgets = []
    
    const { node, app, n_inputs, in_slots, out_slots, input_widgets } = this

    this.debug_log(`constructng chain`)
    if (dandy.chains === undefined) {
      dandy.chains = {}
    }
    dandy.chains[type] = this

    this._contributions = ''
    this._mime = mime

    if (!type_is_dandy(type)) {
      dandy.remove_io_and_widgets(name)
    }
    
    if (n_inputs >= 1) {
      new DandyInvisibleWidget(node, name, [type], app) // cat_widget
    }

    this.each_input((nom, i) => {
      this.debug_log('each input', nom)
      dandy.remove_io_and_widgets(nom)
      new DandyInvisibleWidget(node, nom, [type], app)
    })

    const find_widget = (nom) => node.widgets.find((x) => x.name === nom)
    const cat_widget = this.cat_widget = find_widget(name)
    cat_widget.value = ''

    this.each_input((nom, i) => {
      const widget = find_widget(nom)
      widget.value = ''
      input_widgets.push(widget)
      in_slots.push(dandy.put_input_slot(nom, type))
    })
    
    this.each_output((nom, i) => {
      out_slots.push(dandy.put_output_slot(nom, type))
    })
    
    this.split_chain = false
    if (io_config === IO.IN_SPLIT_OUT) {
      this.split_chain = true
    }
    
    if (DandyChain.debug_blobs) {
      this.debug_blobs_widget = ComfyWidgets.STRING(node, 'debug_blobs', ['', {
        default:'', multiline: true, serialize: false}], app)
    }

    if (dandy.init_after_chain) {
      dandy.init_after_chain()
    }

  }

  get n_inputs() {
    const { io_config } = this
    return Number(io_config.split(':')[0])
  }

  get n_outputs() {
    const { io_config } = this
    return Number(io_config.split(':')[2])
  }

  each_input(f) {
    const { name, n_inputs } = this
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

  // f_each_node: (chain) => {}
  follow_chain(f_each_node, seen = [], on_loop_detected = () => {}, go_passed_split = false) {
    const { node, out_slots, type, split_chain } = this
    const { graph, outputs } = node

    this.debug_log('f_each_node(this)')
    f_each_node(this)

    if (split_chain && !go_passed_split) {
      this.debug_log('stopping propagation')
      return
    }
    
    this.each_output((nom, i) => {
      const out_slot = out_slots[i]
      const output = outputs[out_slot]
      const { links } = output
      if (links === null || links.length === 0) {
        // we've reached the end
        this.debug_log(`reached end with no links, maybe reload your nodes`, links, output)
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
          this.debug_log(`undefined link`)
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
          this.debug_log(`target.dandy: `, target_dandy)
          // we might be connected to a non-dandy input, like 'STRING'
          if (target_dandy) {
            const target_chain = target_dandy.chains[type]
            const stop_at_split = false
            target_chain.follow_chain(f_each_node, seen_prime, on_loop_detected, stop_at_split)
          }
        }
      }
    })
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

  output_update_ignoring_input(value) {
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
    const { node, _contributions, _mime, dandy, type, cat_widget, input_widgets, in_slots, out_slots } = this

    let cat_data = ''

    if (outputting_from_split_chain === false) {
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
          const s = `${in_data}\n`
          cat_data += s
          if (type === 'STRING') {
            this.warn_log("setting input widget", s)
          }
          input_widget.value = s
        }
        else {
          input_widget.value = ''
        }
      })
    }

    const contributions = outputting_from_split_chain ? outputting_from_split_chain : _contributions
    if (type === 'STRING') {
      this.warn_log("my contributions", contributions)
      cat_data += contributions
    }
    else {
      cat_data += JSON.stringify({ value: contributions, mime: _mime })
    }
    
    this.each_output((output_name, i) => {
      const out_slot = out_slots[i]
      node.setOutputData(out_slot, cat_data)
      node.triggerSlot(out_slot)
    })
    
    cat_widget.value = cat_data
    
    if (DandyChain.debug_blobs) {
      this.debug_blobs_widget.widget.element.value = cat_data.split('\n').map((x) => {
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
    this.debug_log(`get data :: ${this.cat_widget.value}`)
    const a = this.cat_widget.value.split('\n').filter(no_fakes)
    const z = a.map((x) => JSON.parse(x)).filter((x) => no_fakes(x.value))
    this.debug_log(`got data :: `, z)
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
// --------------------------------------------------------------------------
export class DandyPrimativeChain extends DandyChain {
  constructor(dandy, name, type, mime, io_config) {
    super(dandy, name, type, mime, io_config)
  }

  get data() {
    // const no_fakes = (x) => x !== 'undefined' && x.length > 0
    this.debug_log(`get data :: ${this.cat_widget.value}`)
    return this.cat_widget.value
    // const a = this.cat_widget.value.split('\n').filter(no_fakes)
    // const z = a.map((x) => JSON.parse(x)).filter((x) => no_fakes(x.value))
    // this.debug_log(`got data :: `, z)
    // return z
  }
}

export class DandyStringChain extends DandyPrimativeChain {
  constructor(dandy, io_config) {
    super(dandy, 'string', 'STRING', M.STRING, io_config)
  }
}

export class DandyIntChain extends DandyPrimativeChain {
  constructor(dandy, io_config) {
    super(dandy, 'int', 'INT', M.VALUE, io_config)
  }
}

export class DandyFloatChain extends DandyPrimativeChain {
  constructor(dandy, io_config) {
    super(dandy, 'float', 'FLOAT', M.VALUE, io_config)
  }
}

export class DandyBooleanChain extends DandyPrimativeChain {
  constructor(dandy, io_config) {
    super(dandy, 'boolean', 'BOOLEAN', M.VALUE, io_config)
  }
}