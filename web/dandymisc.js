
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

export const dandy_stable_diffusion_mode = 'ace/mode/dandy_stable_diffusion'

export class DandyNode {
  constructor(node, app) {
    this.node = node
    this.app = app

    node.serialize_widgets = true

    // if you extend DandyNode, implement on_configure instead of setting it on the node
    node.onConfigure = (info) => {
      // LiteGraph will reconfigure the widgets even if options.serialize is false
      // the values it puts in the chains are invalid by now
      this.for_each_chain((chain, type) => {
        // console.log(`setting chain ${chain.type}`, chain)
        if (chain.widget) {
          chain.widget.value = ''
        } else {
          console.warn(`there is a ${type} chain with no widget.`)
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
      this.on_configure(info)
    }

    node.onConnectionsChange = (i_or_o, index, connected, link_info, input) => {
      // console.warn(`${this.id}.node.onConnectionsChange(type, index, connected, link_info)`, this, type, index, connected, link_info)
      if (link_info) {
        const { chains } = this
        if (chains) {
          const chain = chains[link_info.type]
          if (chain) {
            chain.update_chain()
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
      Object.entries(chains).forEach(([type, chain]) => {
        f_chain_type(chain, type)
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
      node.removeInput(slot)
    }
  }

  remove_output_slot(name) {
    const { node } = this
    const slot = node.findOutputSlot(name)
    if (slot !== -1) {
      node.removeOutput(slot)
    }
  }

  remove_io_and_widgets(name) {
    const { node } = this
    node.widgets = node.widgets.filter((w) => w.name !== name)
    this.remove_input_slot(name)
    this.remove_output_slot(name)
  }

  find_widget(name) {
    return this.node.widgets.find((x) => x.name === name)
  }

  get_colour_palette() {
    const id = 'Comfy.ColorPalette'
    const default_id = 'dark'
    return this.app.ui.settings.getSettingValue(id, default_id)
  }
}

let i_dandy_widget = 0
export class DandyWidget {
  constructor(node, inputName, inputData, app) {
    this.type = inputData[0]
    this.name = inputName
    if (++i_dandy_widget === Number.MAX_SAFE_INTEGER) {
      i_dandy_widget = 0
    }
    this.id = `${inputName}_${i_dandy_widget}`
    this.callback = (value) => {
      // console.log(`${this.id} callback`, value)
    }
    this.options = { serialize: true } // i'm not convinced this does anything
    this.value_ = null
    this.size = [0, 0]
    node.addCustomWidget(this)
    //console.log(`DandyWidget<${this.name}, ${this.type}>`, this)
  }

  get value() {
    // console.log("DandyWidget.get value", this.value_)
    return this.value_
  }

  set value(v) {
    // console.error("DandyWidget.set value", v)
    this.value_ = v
    this.callback(v)
  }

  async serializeValue() {
    // console.log("DandyWidget.serializeValue", this.value_)
    return this.value_
  }

  computeSize(width) {
    return this.size
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

export const dandy_cash = (strings) => {
  let x = 0xDEADBEEF & 0xFFFFFFFF
  const n_strings = strings.length
  for (let i = 0; i < n_strings; ++i) {
    const s = strings[i]
    const n = s.length
    for (let j = 0; j < n; ++j) {
      const c = s.charCodeAt(j) & 0xFF
      x ^= ((x * x + c * c) & 0xFFFFFFFF)
    }
  }
  return x
}

