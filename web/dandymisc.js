
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
  INT: 'text/text',
  FLOAT: 'text/text',
  BOOLEAN: 'text/text',
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


class DandyWorkspaceMinion {
  
  constructor() {
    this.fire_after_config = null
    this.configured_dandys = []
    this.is_configuring = false 
  }

  mark_as_configuring() {
    this.is_configuring = true
  }

  done_configuring(dandy) {
    const ms = 100
    const { configured_dandys } = this
    configured_dandys.push(dandy)
    
    if (this.fire_after_config) {
      clearTimeout(this.fire_after_config)
    }

    this.fire_after_config = setTimeout(() => {
      this.fire_after_config = null
      this.is_configuring = false
      this.update_first_nodes_chains()
      configured_dandys.length = 0
    }, ms)
  }

  update_first_nodes_chains() {
    const { configured_dandys } = this
    const first_of_chains = new Set()

    configured_dandys.forEach((dandy) => {
      dandy.for_each_chain((chain) => {
        first_of_chains.add(chain.find_first())
      })
    })

    first_of_chains.forEach((chain) => {
      chain.update_data()
      chain.update_chain()
    })
  }
}

const minion = new DandyWorkspaceMinion()

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
    console.error(new Error(`${this.constructor.name} :: ${s}`), ...more)
  }

  constructor(node, app) {
    this.node = node
    this.app = app
    this.concat_string_inputs = true

    this.debug_verbose = false
    node.serialize_widgets = true

    if (node.properties === undefined) {
      node.properties = {}
    }
  
    minion.mark_as_configuring()

    // litegraph doesn't check for undefined graph, otherwise same code
    node.removeInput = (slot) => {
      node.disconnectInput(slot)
      const slot_info = node.inputs.splice(slot, 1)
      for (let i = slot; i < node.inputs.length; ++i) {
          if (!node.inputs[i]) {
            continue
          }
          if (!node.graph) {
            continue
          }
          const link = node.graph.links[node.inputs[i].link]
          if (!link) {
              continue
          }
          link.target_slot -= 1
      }
      node.setSize( node.computeSize() )
      if (node.onInputRemoved) {
        node.onInputRemoved(slot, slot_info[0] )
      }
      node.setDirtyCanvas(true, true)
    }

    // litegraph doesn't check for undefined graph, otherwise same code
    node.removeOutput = (slot) => {
      node.disconnectOutput(slot)
      node.outputs.splice(slot, 1)
      for (let i = slot; i < node.outputs.length; ++i) {
          if (!node.outputs[i] || !node.outputs[i].links) {
            continue
          }
          if (!node.graph) {
            continue
          }
          const links = node.outputs[i].links
          for (let j = 0; j < node.length; ++j) {
            const link = node.graph.links[links[j]]
            if (!link) {
              continue
            }
            link.origin_slot -= 1
          }
      }

      node.setSize( node.computeSize() )
      if (node.onOutputRemoved) {
        node.onOutputRemoved(slot)
      }
      node.setDirtyCanvas(true, true)
    }


    // if you extend DandyNode, implement on_configure instead of setting it on the node
    node.onConfigure = (info) => {
      minion.done_configuring(this)

      // LiteGraph will reconfigure the widgets even if options.serialize is false
      // the values it puts in any chains widget are invalid by now
      this.for_each_chain((chain, type) => {
        if (chain.debug_blobs_widget) {
          chain.debug_blobs_widget.widget.value = ''
        }
      })

      this.fix_widget_values()
      this.on_configure(info)
    }

    node.onConnectionsChange = (i_or_o, index, connected, link_info, input) => {

      if (!this.graph_is_configuring) {
        this.debug_log("CONNECTION CHANGE", {
          title: this.node.title || this.node.type,
          i_or_o: i_or_o === 1 ? "INPUT" : "OUTPUT",
          index,
          connected,
          link_info_id: link_info?.id,
          link_info_target: link_info?.target_id,
          link_info_origin: link_info?.origin_id,
          has_link_info: !!link_info
        })
  
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
      }

      this.on_connections_change(i_or_o, index, connected, link_info, input)
    }

    node.onExecutionStart = () => {
      this.on_execution_start()
    }

    node.onNodeExecuted = (output) => {
      this.on_executed(output)      
    }

    node.onRemoved = () => {
      this.on_removed()
    }

    this.fix_widget_values()
  }

  get graph_is_configuring() {
    return minion.is_configuring
  }

  fix_widget_values() {
    const { node } = this
    const { widgets } = node
    if (!widgets) {
      //this.warn_log('No widgets to fix')
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

  is_in_graph() {
    const { node } = this
    return node && node.graph
  }

  add_dom_widget(name, type, element, options, when_inserted) {
    const widget = this.node.addDOMWidget(name, type, element, options)

    if (when_inserted) {
      const check = () => {
        if (this.is_in_graph()) {
          if (element.isConnected || document.contains(element)) {
            when_inserted(widget, element)
          } else {
            requestAnimationFrame(check)
          }
        }
      }
      requestAnimationFrame(check)
    }

    return widget
  }

  on_configure(info) {
    // this.warn_log(`default on_configure running`)
  }

  on_connections_change(i_or_o, index, connected, link_info, input) {
    // this.warn_log(`default on_connections_change running`)
  }

  on_execution_start() {
  }

  on_executed(output) {
  }

  on_removed() {

  }

  each_io_name(name, n, f) {
    for (let i = 0; i < n; ++i) {
      const nom = n === 1 ? name : `${name}${i}`
      f(nom, i)
    }
  }
  
  _remove_io_after(n, name, i_or_o, f_remover) {
    const regex = new RegExp(`${name}(\\d*)$`);
    const get_number = (s) => {
      const match = s.match(regex)
      if (match) {
        return parseInt(match[1])
      } else {
        return null
      }
    }
    if (!i_or_o) {
      this.warn_log("no i_or_o", name)
      return
    }
    const noms = i_or_o.map((x) => x.name).filter((x) => x.match(regex))
    noms.forEach((nom) => {
      const d = get_number(nom)
      if (d >= n) {
        f_remover(nom)
      }
    })
  }

  remove_inputs_after(n, name) {
    this._remove_io_after(n, name, this.node.inputs, (nom) => {
      this.remove_input_slot(nom)
    })
  }

  remove_outputs_after(n, name) {
    this._remove_io_after(n, name, this.node.outputs, (nom) => {
      this.remove_output_slot(nom)
    })
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

  rename_input_slot(from, to) {
    const { node } = this
    const i_want_the_object = true
    const input = node.findInputSlot(from, i_want_the_object)
    if (input !== -1) {
      input.name = to
    }
  }

  rename_output_slot(from, to) {
    const { node } = this
    const i_want_the_object = true
    const output = node.findOutputSlot(from, i_want_the_object)
    if (output !== -1) {
      output.name = to
    }
  }

  put_input_slot(name, type) {
    const { node } = this
    const already = node.findInputSlot(name)
    if (already !== -1) {
      return already
    }
    const color = DandyColorTypeMap[type]
    node.addInput(name, type, { color })
    return node.findInputSlot(name)
  }

  put_output_slot(name, type) {
    const { node } = this
    const already = node.findOutputSlot(name)
    if (already !== -1) {
      return already
    }
    const color = DandyColorTypeMap[type]
    node.addOutput(name, type, { color })
    return node.findOutputSlot(name)
  }

  remove_input_slot(name) {
    const { node } = this
    const slot = node.findInputSlot(name)
    if (slot > -1) {
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
    if (slot > -1) {
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
      this.debug_log(`default callback`, value)
    }
    this.options = { serialize: true } // i'm not convinced this does anything
    Object.assign(this.options, options)
    this.value_ = null
    this.size = [0, 0]
    node.addCustomWidget(this)
    //this.debug_log(`constructed`, this)
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

export class DandyIncredibleShrinkingWidget extends DandyWidget {
  constructor(node, height) {
    super(node, 'dandy_incredible_shrinking_widget', '', {})
    this.size = [0, height]
  }
}


export const dandy_js_plain_module_toggle = (dandy) => {
  const { node } = dandy // don't put chains in this it's not there yet
  const default_classic = false
  const options = { on: 'module js', off: 'classic js' }
  const callback = (x) => {
    console.log("WHIPPITYWOO", dandy.chains[DandyTypes.JS])
    dandy.chains[DandyTypes.JS].forEach((chain) => {
      console.log("WHIPPITYWOO 222 :: ", chain)
      chain.mime = x ? Mimes.JS_MODULE : Mimes.JS
      chain.update_chain()
    })
  }
  const name = ''
  const widget = dandy.module_toggle_widget = node.addWidget(
    'toggle', name, default_classic, callback, options)
  return widget
}

export const dandy_delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const dandy_cash = (message, salt=0) => {
  let msg = `${JSON.stringify(message)}${salt}`
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
    const widget = this.widget = dandy.find_widget(DandyNames.HASH)
    const size = [0, -4]
    this.message = Date.now()
    this._salt = 0
    this.message_f = async () => {
      return this.message
    }
    widget.computeSize = () => size
    widget.size = size
    widget.serializeValue = async () => {
      this.update_message()
      // console.log(`Serializing hash: ${this.hash}`)
      return this.hash
    }
  }

  async update_message() {
    this.message = await this.message_f()
  }

  get hash() {
    const { message, _salt } = this
      return dandy_cash(message, _salt)
  }

  salt() {
    if (this._salt++ >= 5000) {
      this._salt = 0
    }
  }
}

export const dandy_load_url = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    if (!response.ok) {
      console.error(new Error(`Failed to fetch url: ${url}`))
      return ""
    }
    return await response.text()

  } catch (error) {
    console.error(error)
    return ""
  }
}

export const dandy_load_list_of_urls = async (urls, f) => {
  const out = []
  for (let i = 0; i < urls.length; ++i) {
    const url = urls[i]      
    const text = await dandy_load_url(url)
    if (text.length > 0) {
      const o = f(text)
      out.push(o)
    }
  }
  return out
}


