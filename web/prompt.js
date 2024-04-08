import { DandyEditor } from "/extensions/dandy/editors.js"
import { IO, DandyStringChain } from "/extensions/dandy/chains.js"
import { DandySocket } from "/extensions/dandy/socket.js"
import { Mimes, DandyNames, dandy_cash, dandy_stable_diffusion_mode } from "/extensions/dandy/dandymisc.js"

export class DandyPrompt extends DandyEditor {
  constructor(node, app) {
    super(node, app, Mimes.CLIP)
    const string_chain = this.string_chain = new DandyStringChain(this, IO.IN_OUT)
    
    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode(dandy_stable_diffusion_mode)
    this.set_text("")

    const socket = this.socket = new DandySocket(this)
    socket.on_request_string = (o) => {
      o.string = string_chain.data.map((x) => x.value).join('\n')
      socket.deliver_string(o)
    }

    const hash_widget = this.hash_widget = this.find_widget(DandyNames.HASH)
    hash_widget.computeSize = () => [0, -20]
    hash_widget.serializeValue = async () => {
      const s = JSON.stringify(string_chain.data)
      return dandy_cash(s)
    }

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
