
export const DandyColors = {
  CODE: "slateblue",
  DOC: "darkviolet",
  DATA: "goldenrod"
}

const DandyColorTypeMap = {
  JS: DandyColors.CODE,
  WASM: DandyColors.CODE,
  HTML: DandyColors.DOC,
  CSS: DandyColors.DOC,
  JSON: DandyColors.DATA,
  YAML: DandyColors.DATA,
  IMAGE_URL: DandyColors.DATA,
}

export const ComfyTypes = {
  INT: 'INT',
  STRING: 'STRING',
  FLOAT: 'FLOAT',
  BOOLEAN: 'BOOLEAN',
}

export const ComfyTypesList = Object.entries(ComfyTypes).map(([k,v]) => v)

export const DandyTypes = {
  PROMPT: 'DANDY_PROMPT',
  HASH: 'DANDY_HASH',
  SERVICE_ID: 'DANDY_SERVICE_ID',
  JS: 'DANDY_JS_URLS',
  WASM: 'DANDY_WASM_URLS',
  HTML: 'DANDY_HTML_URLS',
  CSS: 'DANDY_CSS_URLS',
  JSON: 'DANDY_JSON_URLS',
  YAML: 'DANDY_YAML_URLS',
  IMAGE_URL: 'DANDY_IMAGE_URL',
  DIRTY: 'DANDY_DIRTY',
}

export const DandyNames = {
  PROMPT: 'dandy_prompt',
  HASH: 'hash',
  SERVICE_ID: 'service_id',
  JS: 'js',
  WASM: 'wasm',
  HTML: 'html',
  CSS: 'css',
  JSON: 'json',
  YAML: 'yaml',
  IMAGE_URL: 'image_url',
  DIRTY: 'dandy_dirty',
}

export const Mimes = {
  JS_MODULE: 'module',
  JS: 'application/javascript',
  WASM: 'application/wasm',
  HTML: 'text/html',
  CSS: 'text/css',
  JSON: 'application/json',
  YAML: 'application/yaml',
  PNG: 'image/png',
  CLIP: 'text/clip',
  STRING: 'text/text',
  VALUE: 'value/javascript',
}

export const type_is_dandy = (type) => {
  let found = false
  Object.entries(DandyTypes).forEach(([key, value]) => {
    if (type === value) {
      found = true
    }
  })
  return found
}
export const dandy_stable_diffusion_mode = 'ace/mode/dandy_stable_diffusion'

export class DandyNode {

  debug_log(s, ...more) {
    if (this.debug_verbose) {
      console.log(`${this.constructor.name} :: ${s}`, ...more)
    }
  }

  log(s, ...more) {
    console.log(`${this.constructor.name}<${this.name}, ${this.type}> :: ${s}`, ...more)
  }

  warn_log(s, ...more) {
    console.warn(`${this.constructor.name} :: ${s}`, ...more)
  }

  error_log(s, ...more) {
    console.error(`${this.constructor.name} :: ${s}`, ...more)
  }

  constructor(node, app) {
    this.node = node
    this.app = app

    this.debug_verbose = false
    node.serialize_widgets = true

    // if you extend DandyNode, implement on_configure instead of setting it on the node
    node.onConfigure = (info) => {
      // LiteGraph will reconfigure the widgets even if options.serialize is false
      // the values it puts in the chains are invalid by now
      this.for_each_chain((chain, type) => {
        this.debug_log(`setting chain ${chain.type}`, chain)
        if (chain.cat_widget) {
          chain.cat_widget.value = ''
        } else {
          this.warn_log(`there is a ${type} chain with no widget.`)
        }
        if (chain.debug_blobs_widget) {
          chain.debug_blobs_widget.widget.value = ''
        }
  
        if (chain.is_start) {
          const one_sec = 1000
          setTimeout(() => {
            chain.update_chain()  
          }, one_sec)
        }
      })

      this.fix_widget_values()
      this.on_configure(info)
    }

    node.onConnectionsChange = (i_or_o, index, connected, link_info, input) => {
      // console.warn(`${this.id}.node.onConnectionsChange(type, index, connected, link_info)`, this, type, index, connected, link_info)
      if (link_info) {
        const { chains } = this
        if (chains) {
          const our_chains = chains[link_info.type]
          if (our_chains) {
            our_chains.forEach((chain) => {
              if (chain) {
                chain.update_chain()
              }
            })
          }
        }
      }
      this.on_connections_change(i_or_o, index, connected, link_info, input)
    }

    node.onExecutionStart = () => {
      this.on_execution_start()
    }

    node.onExecuted = (output) => {
      this.on_executed(output)      
    }

    node.onRemoved = () => {
      this.on_removed()
    }

    this.fix_widget_values()
  }

  fix_widget_values() {
    const { node } = this
    const { widgets } = node
    if (!widgets) {
      this.warn_log('No widgets to fix')
      return
    }
    widgets.forEach((widget) => {
      const { name, type, value, options } = widget

      const default_value = (x) => {
        if (options && options.default) {
          return options.default
        }
        return x
      }

      if (type === 'number') {
        if (typeof value !== 'number') {
          widget.value = default_value(0)
        }
        if (widget.value === 0 && (name === 'width' || name === 'height')) {
          widget.value = 1
        }
      }
      
      if (type === 'toggle' && typeof value !== 'boolean') {
        widget.value = default_value(false)
      }

      if (type === 'STRING' && typeof value !== 'string') {
        widget.value = ''
      }
      
    })
  }

  on_configure(info) {
    console.warn(`${this.constructor.name} default on_configure running`)
  }

  on_connections_change(i_or_o, index, connected, link_info, input) {
  }

  on_execution_start() {
  }

  on_executed(output) {
  }

  on_removed() {

  }

  for_each_chain(f_chain_type) {
    const { chains } = this
    if (chains) {
      Object.entries(chains).forEach(([type, chainy]) => {
        chainy.forEach((chain) => {
          f_chain_type(chain, type)
        })
      })
    }
  }

  put_input_slot(name, type) {
    const { node } = this
    this.remove_input_slot(name)
    const color = DandyColorTypeMap[type]
    node.addInput(name, type, { color })
    return node.findInputSlot(name)
  }

  put_output_slot(name, type) {
    const { node } = this
    this.remove_output_slot(name)
    const color = DandyColorTypeMap[type]
    node.addOutput(name, type, { color })
    return node.findOutputSlot(name)
  }

  remove_input_slot(name) {
    const { node } = this
    const slot = node.findInputSlot(name)
    if (slot !== -1) {
      try {
        node.removeInput(slot)
      } catch (error) {
        this.error_log(`removing input slot failed`, error)
      }
    }
  }

  remove_output_slot(name) {
    const { node } = this
    const slot = node.findOutputSlot(name)
    if (slot !== -1) {
      try {
        node.removeOutput(slot)
      } catch (error) {
        this.error_log(`removing output slot failed`, error)
      }
    }
  }

  remove_io_and_widgets(name) {
    this.remove_widgets(name)
    this.remove_inputs(name)
    this.remove_outputs(name)
  }


  remove_inputs_and_widgets(name) {
    this.remove_widgets(name)
    this.remove_inputs(name)
  }

  remove_widgets(name) {
    const { node } = this
    node.widgets = node.widgets.filter((w) => !w.name.startsWith(name))
  }

  remove_inputs(name) {
    const { node } = this
    for (let x = 1, i = 0; x >= 0; ++i) {
      const nom = `${name}${i}`
      x = node.findInputSlot(nom)
      this.remove_input_slot(nom)
    }
    this.remove_input_slot(name)
  }

  remove_outputs(name) {
    const { node } = this
    for (let x = 1, i = 0; x >= 0; ++i) {
      const nom = `${name}${i}`
      x = node.findOutputSlot(nom)
      this.remove_output_slot(nom)
    }
    this.remove_output_slot(name)
  }

  find_widget(name) {
    const widget = this.node.widgets.find((x) => x.name === name)
    if (!widget) {
      this.warn_log(`find_widget(${name}) :: no widget`)
      return undefined
    }
    return widget
  }

  get_colour_palette() {
    const id = 'Comfy.ColorPalette'
    const default_id = 'dark'
    return this.app.ui.settings.getSettingValue(id, default_id)
  }
}

// -----------------------------------------------------------------------------------------------
let i_dandy_widget = 0
export class DandyWidget {
  debug_log(s, ...more) {
    if (this.debug_verbose) {
      console.log(`${this.constructor.name}<${this.name}, ${this.type}> :: ${s}`, ...more)
    }
  }

  log(s, ...more) {
    console.log(`${this.constructor.name}<${this.name}, ${this.type}> :: ${s}`, ...more)
  }

  warn_log(s, ...more) {
    console.warn(`${this.constructor.name}<${this.name}, ${this.type}> :: ${s}`, ...more)
  }

  error_log(s, ...more) {
    console.error(`${this.constructor.name}<${this.name}, ${this.type}> :: ${s}`, ...more)
  }

  constructor(node, name, type, options={}) {
    this.debug_verbose = false
    this.type = type
    this.name = name
    if (++i_dandy_widget === Number.MAX_SAFE_INTEGER) {
      i_dandy_widget = 0
    }
    this.id = `${name}_${i_dandy_widget}`
    this.callback = (value) => {
      this.debug_log(`callback`, value)
    }
    this.options = { serialize: true } // i'm not convinced this does anything
    Object.assign(this.options, options)
    this.value_ = null
    this.size = [0, 0]
    node.addCustomWidget(this)
    this.log(`constructed`, this)
  }

  get value() {
    this.debug_log("get value", this.value_)
    return this.value_
  }

  set value(v) {
    this.debug_log("set value", v)
    this.value_ = v
    this.callback(v)
  }

  async serializeValue() {
    this.debug_log("serializeValue", this.value_)
    return this.value_
  }

  computeSize(width) {
    return this.size
  }
}

export class DandyInvisibleWidget extends DandyWidget {
  constructor(node, name, type, options={}) {
    super(node, name, type, options)
    this.size = [0, -4] // LiteGraph will pad it by 4
  }
}

export const dandy_js_plain_module_toggle = (dandy) => {
  const { node } = dandy // don't put chains in this it's not there yet
  const default_classic = false
  const options = { on: 'module js', off: 'classic js' }
  const callback = (x) => {
    dandy.chains[DandyTypes.JS].mime = x ? Mimes.JS_MODULE : Mimes.JS
  }
  const name = ''
  const widget = dandy.module_toggle_widget = node.addWidget(
    'toggle', name, default_classic, callback, options)
  return widget
}

export const dandy_delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const dandy_cash = (message) => {
  let msg = JSON.stringify(message)
  if (msg === undefined) {
    console.error('dandy_cash got bad message', message)
    msg = 'undefined'
  } 

  let x = 0xDEADBEEF & 0xFFFFFFFF
  const n = msg.length
  for (let j = 0; j < n; ++j) {
    const c = msg.charCodeAt(j) & 0xFF
    x ^= ((x * x + c * c) & 0xFFFFFFFF)
  }
  return x
}

export class DandyHashDealer {
  constructor(dandy) {
    this.dandy = dandy
    this.message_getter = () => Date.now()
    const widget = this.widget = dandy.find_widget(DandyNames.HASH)
    const size = [0, -4]
    this.message = Date.now()
    widget.computeSize = () => size
    widget.size = size
    widget.serializeValue = async () => {
      const { message } = this
      return dandy_cash(message)
    }

  }

  get hash() {
    const { message } = this
    return dandy_cash(message)
  }

}

