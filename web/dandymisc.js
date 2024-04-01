

export const DandyTypes = {
  SERVICE_ID: 'DANDY_SERVICE_ID',
  URL: 'DANDY_URLS',
  JS: 'DANDY_JS_URLS',
  HTML: 'DANDY_HTML_URLS',
  CSS: 'DANDY_CSS_URLS',
  JSON: 'DANDY_JSON_URLS',
  YAML: 'DANDY_YAML_URLS',
  WASM: 'DANDY_WASM_URLS',
  CAPTURES: 'DANDY_CAPTURE',
  B64IMAGES: 'DANDY_B64IMAGES',
  B64MASKS: 'DANDY_B64MASKS',
  DIRTY: 'DANDY_DIRTY',
}

export const DandyNames = {
  SERVICE_ID: 'service_id',
  URL: 'url',
  JS: 'js',
  HTML: 'html',
  CSS: 'css',
  JSON: 'json',
  YAML: 'yaml',
  WASM: 'wasm',
  CAPTURES: 'captures',
  B64IMAGES: 'b64images',
  B64MASKS: 'b64masks',
  DIRTY: 'dandy_dirty',
}

export const Mimes = {
  JS: 'application/javascript',
  HTML: 'text/html',
  CSS: 'text/css',
  JSON: 'application/json',
  YAML: 'application/yaml',
  WASM: 'application/wasm',
}

export class DandyNode {
  constructor(node, app) {
    this.node = node
    this.app = app

    node.serialize_widgets = true

    // if you extend DandyNode, implement on_configure instead of setting it on the node
    node.onConfigure = (info) => {
      const { chains } = this
      // LiteGraph will reconfigure the widgets even if options.serialize is false
      // the values it puts in the chains are invalid by now
      if (chains) {
        Object.entries(chains).forEach(([type, chain]) => {
          // console.log(`setting chain ${chain.type}`, chain)
          chain.widget.value = ''
          if (chain.debug_blobs_widget) {
            chain.debug_blobs_widget.widget.value = ''
          }
        })
      }
      this.on_configure(info)
    }

    node.onConnectionsChange = (type, index, connected, link_info) => {
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
      this.on_connections_change(type, index, connected, link_info)
    }

    node.onExecutionStart = () => {
      this.on_execution_start()
    }

    node.onExecuted = (output) => {
      this.on_executed(output)      
    }
  }

  on_configure(info) {
  }

  on_connections_change() {
  }

  on_execution_start() {
  }

  on_executed(output) {
  }

  put_input_slot(name, type) {
    const { node } = this
    const slot = node.findInputSlot(name)
    if (slot === -1) {
      node.addInput(name, type)
    }
    return node.findInputSlot(name)
  }

  put_output_slot(name, type) {
    const { node } = this
    const slot = node.findOutputSlot(name)
    if (slot === -1) {
      node.addOutput(name, type)
    }
    return node.findOutputSlot(name)
  }

  remove_input_slot(name) {
    const { node } = this
    const slot = node.findInputSlot(name)
    if (slot !== -1) {
      node.removeInput(name)
    }
  }

  remove_output_slot(name) {
    const { node } = this
    const slot = node.findInputSlot(name)
    if (slot !== -1) {
      node.removeOutput(name)
    }
  }

  find_widget(name) {
    return this.node.widgets.find((x) => x.name === name)
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
    console.log(`DandyWidget<${this.name}, ${this.type}>`, this)

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
