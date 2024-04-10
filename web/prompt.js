import { DandyEditor } from "/extensions/dandy/editors.js"
import { DandyStringChain } from "/extensions/dandy/chains.js"
import { DandySocket } from "/extensions/dandy/socket.js"
import { Mimes, DandyNames, dandy_cash, dandy_stable_diffusion_mode, DandyHashDealer } from "/extensions/dandy/dandymisc.js"

export class DandyPrompt extends DandyEditor {
  constructor(node, app) {
    super(node, app, Mimes.CLIP)
    const string_chain = this.string_chain = new DandyStringChain(this, 1, 1)
    
    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode(dandy_stable_diffusion_mode)
    this.set_text("")

    const socket = this.socket = new DandySocket(this)
    socket.on_request_string = (o) => {
      o.string = string_chain.data
      socket.deliver_string(o)
    }

    this.hash_dealer = new DandyHashDealer(this)
    this.hash_dealer.message_getter = () => string_chain.data

    node.size = [500, 180]
  }

  on_settings_applied(options) {
    const { editor } = this
    const overrides = {
      highlightActiveLine: false,
      highlightSelectedWord: false,
      enableAutoIndent: false,
      showGutter: false,
      wrap: 'free',
    }
    editor.setOptions(overrides)
  }

  apply_text() {
    const { editor, node, string_chain } = this
    const { properties } = node
    const text = editor.getValue()
    properties.text = text
    if (string_chain) {
      string_chain.contributions = text
    }
  }
}
