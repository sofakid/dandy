import { DandyEditor } from "/extensions/dandy/editors.js"
import { DandyStringChain } from "/extensions/dandy/chains.js"
import { DandySocket } from "/extensions/dandy/socket.js"
import { Mimes, DandyNames, dandy_cash, dandy_stable_diffusion_mode, DandyHashDealer } from "/extensions/dandy/dandymisc.js"

export class DandyPrompt extends DandyEditor {
  constructor(node, app) {
    super(node, app, Mimes.CLIP)
    const input_string_chain = this.input_string_chain = new DandyStringChain(this, 1, 0)
    const output_string_chain = this.output_string_chain = new DandyStringChain(this, 0, 1)
    
    this.when_editor_ready(() => {
      const { editor } = this
      const editor_session = editor.getSession()
      editor_session.setMode(dandy_stable_diffusion_mode)
      this.set_text("")
    })

    const socket = this.socket = new DandySocket(this)
    socket.on_request_string = (o) => {
      o.string = string_chain.data
      socket.deliver_string(o)
    }

    socket.on_sending_input = (o) => {
      const { input, py_client } = o
      const { string } = input
      
      const strings = []

      if (string !== undefined) {
        if (typeof string === 'string') {
            this.debug_log('on_sending_input :: string input is string: ', string)
            strings.push(string)
        } else if (Array.isArray(string)) {
          string.forEach((str) => {
            this.debug_log('on_sending_input :: string input is array, each: ', str)
            strings.push(str)
          })
        } else {
          this.error_log(`got invalid string`, string)
        }
      }
      
      const cat = this.do_cat(strings)
      const o_thanks = { prompt: cat } 
      this.debug_log("o_thanks", o_thanks)
      socket.thanks(py_client, o_thanks)
    }

    this.hash_dealer = new DandyHashDealer(this)
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
      indentedSoftWrap: false,
    }
    editor.setOptions(overrides)
  }

  on_chain_updated(chain) {
    const { input_string_chain } = this
    if (chain === input_string_chain) {
      const input_strings = input_string_chain.values
      this.do_cat(input_strings)
    }
  }

  apply_text() {
    this.when_editor_ready(() => {
      const { editor, node, input_string_chain } = this
      const { properties } = node
      const text = editor.getValue()
      properties.text = text
  
      const input_strings = input_string_chain.values
      this.do_cat(input_strings)
    })
  }

  do_cat(input_strings) {
    const { output_string_chain, node } = this
    const { properties } = node
    input_strings.push(properties.text)
    const cat = input_strings.join('\n')
    output_string_chain.contributions = cat
    this.rehash()
    return cat
  }

  rehash() {
    const { output_string_chain, hash_dealer } = this
    const strings = output_string_chain.values
    hash_dealer.message = strings
  }
}
