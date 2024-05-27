import { DandyEditor } from "/extensions/dandy/editors.js"
import { DandyStringChain, DandyIntChain, DandyFloatChain, DandyBooleanChain } from "/extensions/dandy/chains.js"
import { Mimes } from "/extensions/dandy/dandymisc.js"

const NICE_PREVIEW_SIZE = [340, 130]

export class DandyPreview extends DandyEditor {
  
  constructor(node, app, name, mime, js_type) {
    super(node, app, mime)
    this.debug_verbose = false
    this.chain = null

    this.completely_hide_tray()
    
    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/text')
    this.set_text("")

    const { socket } = this
    socket.on_sending_input = (o) => {
      const { chain } = this
      const { input, py_client } = o
      const value = input[name]

      const f = (x) => {
        chain.output_update_ignoring_input(x) // outputting a catted string, wrong
        this.set_text(x)
      }
      if (value !== undefined) {
        if (typeof value === js_type) {
          chain.output_update_ignoring_input(value) // outputting a catted string, wrong
          this.set_text(`${value}`)
        } else if (Array.isArray(value)) {
          chain.output_update_ignoring_input(value) // outputting a catted string, wrong
          this.set_text(value.map((x) => `${x}`).filter((x) => x !== '').join(', '))
        } else {
          this.error_log(`got invalid ${name}`, value)
          this.set_text(`Error in input ${name}: ${value}`)
        }
      }
      socket.thanks(py_client)
    }
  }

  on_settings_applied() {
    const { editor } = this
    editor.setOption('readOnly', true)
    editor.setOption('showGutter', false)
    editor.setOption('wrap', 'free')
    editor.setOption('indentedSoftWrap', false)
  }

  on_chain_updated(chain) {
    const { data } = chain
    if (typeof data === 'string') {
      this.error_log("we don't do things this way anymore, not since.. the incident..")
      this.set_text(data)
    }
    else if (Array.isArray(data)) {
      const x = data.map((x, i) => {
        return `${x.value}`
      }).join(', ')
      this.set_text(x)
    }
    else {
      this.error_log("UNKNOWN DATA", data)
      this.set_text(`unknown data: ${data}`)
    }
  }

  apply_text() {
    const { editor, node, hash_dealer } = this
    const { properties } = node
    const text = editor.getValue()
    properties.text = text
    hash_dealer.message = text
  }
}

export class DandyStringPreview extends DandyPreview {
  constructor(node, app) {
    super(node, app, 'string', Mimes.STRING, 'string')
    this.concat_string_inputs = false
    this.chain = new DandyStringChain(this, 1, 1)
    node.size = NICE_PREVIEW_SIZE
  }
}

export class DandyIntPreview extends DandyPreview {
  constructor(node, app) {
    super(node, app, 'int', Mimes.INT, 'number')
    this.chain = new DandyIntChain(this, 1, 1)
    node.size = NICE_PREVIEW_SIZE
  }
}

export class DandyFloatPreview extends DandyPreview {
  constructor(node, app) {
    super(node, app, 'float', Mimes.FLOAT, 'number')
    this.chain = new DandyFloatChain(this, 1, 1)
    node.size = NICE_PREVIEW_SIZE
  }
}

export class DandyBooleanPreview extends DandyPreview {
  constructor(node, app) {
    super(node, app, 'boolean', Mimes.BOOLEAN, 'boolean')
    this.chain = new DandyBooleanChain(this, 1, 1)
    node.size = NICE_PREVIEW_SIZE
  }
}

