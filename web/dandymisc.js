
export const DandyTypes = {
  JS: 'JS_URLS',
  HTML: 'HTML_URLS',
  CSS: 'CSS_URLS',
  JSON: 'JSON_URLS',
  YAML: 'YAML_URLS',
  CAPTURES: 'DANDY_CAPTURE',
}

export const DandyNames = {
  JS: 'js',
  HTML: 'html',
  CSS: 'css',
  JSON: 'json',
  YAML: 'yaml',
  CAPTURES: 'captures'
}

export const Mimes = {
  JS: 'application/javascript',
  HTML: 'text/html',
  CSS: 'text/css',
  JSON: 'application/json',
  YAML: 'application/yaml',
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
          chain.widget.value = ''
          if (chain.debug_blobs_widget) {
            chain.debug_blobs_widget.widget.value = ''
          }
        })
      }
      this.on_configure()
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
    }
  }

  on_configure(info) {
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