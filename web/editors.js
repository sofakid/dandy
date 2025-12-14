import { DandySocket } from "/extensions/dandy/socket.js"
import { DandyJsChain, DandyCssChain, DandyHtmlChain, DandyJsonChain, DandyYamlChain, 
         DandyStringChain, DandyIntChain, DandyFloatChain } from "/extensions/dandy/chains.js"
import { Mimes, DandyNode, dandy_js_plain_module_toggle, dandy_stable_diffusion_mode, 
         DandyNames, DandyHashDealer, DandyIncredibleShrinkingWidget } from "/extensions/dandy/dandymisc.js"
import { ace_themes, ace_keyboards, dandy_settings, wait_for_DandySettings } from "/extensions/dandy/editor_settings.js"

const dandy_webroot = "/extensions/dandy/"

const NICE_SMALL_EDITOR_SIZE = [340, 130]

export const init_DandyEditors = async () => {
  // comfyui will try to load these if we leave them as .js files.
  // but ace wants to load them its own way,
  // so we rename them to .js_ and map the features here
  const features_and_codes = [
    "mode/javascript", "mode-javascript.js_",
    "mode/html", "mode-html.js_",
    "mode/text", "mode-text.js_",
    "mode/css", "mode-css.js_",
    "mode/json", "mode-json.js_",
    "mode/yaml", "mode-yaml.js_",
    "mode/javascript_worker", "worker-javascript.js_",
    "mode/html_worker", "worker-html.js_",
    "mode/css_worker", "worker-css.js_",
    "mode/json_worker", "worker-json.js_",
    "mode/yaml_worker", "worker-yaml.js_",
  ]

  ace_keyboards.forEach((keyboard) => {
    if (keyboard !== 'ace') {
      features_and_codes.push(`keyboard/${keyboard}`)
      features_and_codes.push(`keybinding-${keyboard}.js_`)
    }
  })

  ace_themes.forEach((theme) => {
    features_and_codes.push(`theme/${theme}`)
    features_and_codes.push(`theme-${theme}.js_`)
  })
  
  for (let i = 0; i < features_and_codes.length; i += 2) {
    const feature = features_and_codes[i]
    const js_ = features_and_codes[i + 1]
    const response = await fetch(`${dandy_webroot}ace/${js_}`)
    const text = await response.text()
    const blob = new Blob([text], { type: Mimes.JS })
    const url = URL.createObjectURL(blob)
    ace.config.setModuleUrl(`ace/${feature}`, url)
    //console.log(`ace.config.setModuleUrl("ace/${feature}", ${url})`)
  }

  const dsd_mode_js = `
    ace.define("${dandy_stable_diffusion_mode}", function (require, exports, module) {
      const oop = require("ace/lib/oop")
      const TextMode = require("ace/mode/text").Mode
      const TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules

      const DandyStableDiffusionHighlightRules = function() {
        this.$rules = {
          "start": [
            { token: "string",                regex: '".*?"' },
            { token: "string",                regex: "'.*?'" }, 
            { token: "constant.numeric",      regex: /[\\d.]+/ },
            { token: "constant.otherkeyword", regex: /[\\.,:]/ },
            { token: "keyword.other.unit",    regex: /[\\[\\]]/ },
            { token: "keyword.operator",      regex: /[()]/ },
            { token: "keyword",               regex: /[<>]/ }
          ]
        }
      }

      oop.inherits(DandyStableDiffusionHighlightRules, TextHighlightRules)
      exports.DandyStableDiffusionHighlightRules = DandyStableDiffusionHighlightRules

      const Mode = function() {
        this.HighlightRules = DandyStableDiffusionHighlightRules
      }

      oop.inherits(Mode, TextMode)

      exports.Mode = Mode
    })
  `
  const dsd_mode_blob = new Blob([dsd_mode_js], { type: Mimes.JS })
  const dsd_mode_url = URL.createObjectURL(dsd_mode_blob)
  ace.config.setModuleUrl(dandy_stable_diffusion_mode, dsd_mode_url)
}

const text_input_class = 'dandyTextInput'
const button_class = 'dandyEditorButton'
const button_row_class = 'dandyButtonRow'
const tray_closed_class = 'dandyTrayClosed'
const tray_class = 'dandyTray'
const tray_header_class = 'dandyTrayHeader'
const tray_content_class = 'dandyTrayContent'
const caret_class = 'dandyCaret'
const hidden_class = 'dandyHidden'

class DandyEditorTopBar {
  constructor(dandy, parent) {
    this.dandy = dandy

    const div = this.div = document.createElement('div')
    div.classList.add(tray_class)

    const tray_header = document.createElement('div')
    const tray_content = document.createElement('div')
    tray_header.classList.add(tray_header_class)
    tray_content.classList.add(tray_content_class)
    tray_content.classList.add(tray_closed_class)

    div.appendChild(tray_header)
    div.appendChild(tray_content)
    
    dandy.filename = ''

    const filename_input = this.filename_input = document.createElement('input')
    filename_input.type = 'text'
    filename_input.placeholder = "untitled"
    filename_input.spellcheck = false
    filename_input.autocapitalize = false
    filename_input.autocomplete = false
    filename_input.classList.add(text_input_class)

    tray_content.appendChild(filename_input)

    filename_input.addEventListener("input", () => {
      this.set_filename(filename_input.value)
    })
    
    const button_div = document.createElement('div')
    const open_button = document.createElement('span')
    const close_button = document.createElement('span')
    tray_content.appendChild(button_div)
    tray_header.appendChild(open_button)
    tray_header.appendChild(close_button)
    
    button_div.classList.add(button_row_class)

    open_button.classList.add(caret_class)
    open_button.innerHTML = '▼'

    close_button.classList.add(caret_class)
    close_button.classList.add(hidden_class)
    close_button.innerHTML = '▲'

    const show_tray = () => {
      tray_content.classList.remove(tray_closed_class)
      tray_content.classList.add(tray_content_class)
      open_button.classList.add(hidden_class)
      close_button.classList.remove(hidden_class)
      button_div.classList.add(button_row_class)
      button_div.classList.remove(hidden_class)
    }

    const hide_tray = () => {
      tray_content.classList.remove(tray_content_class)
      tray_content.classList.add(tray_closed_class)
      open_button.classList.remove(hidden_class)
      close_button.classList.add(hidden_class)
      button_div.classList.remove(button_row_class)
      button_div.classList.add(hidden_class)
    }
    
    open_button.addEventListener("click", show_tray)
    close_button.addEventListener("click", hide_tray)
    hide_tray()

    const save_button = document.createElement('button')
    save_button.classList.add(button_class)
    save_button.onclick = () => {
      const { editor, mimetype, filename } = dandy
      const text = editor.getValue()
      const blob = new Blob([text], { type: `${mimetype};charset=utf-8` })
      saveAs(blob, filename)
    }
    save_button.innerHTML = "save as..."

    const file_input = this.file_input = document.createElement("input")
    const on_files_selected = async () => {
      if (file_input.files.length) {
        await dandy.load_file(file_input.files[0])
      }
    }

    Object.assign(file_input, {
      type: "file",
      multiple: false,
      accept: dandy.mimetype,
      style: "display: none",
      onchange: on_files_selected,
    })
    div.appendChild(file_input)

    const load_file_button = document.createElement('button')
    load_file_button.classList.add(button_class)
    load_file_button.onclick = () => {
      file_input.click()
      file_input.value = null
    }
    load_file_button.innerHTML = "upload file..."

    button_div.appendChild(load_file_button)
    button_div.appendChild(save_button)

    parent.appendChild(div)
    this.apply_styles()
  }

  apply_styles() {
    const update_css = (klass, pairs) => {
      for (let i = 0; i < document.styleSheets.length; i++) {
        const ss = document.styleSheets[i]
        for (var j = 0; j < ss.cssRules.length; j++) {
          const rule = ss.cssRules[j]
          if (rule.selectorText === klass) {
            for (let i = 0; i < pairs.length; i += 2) {
              const property = pairs[i]
              const value = pairs[i + 1]
              rule.style[property] = value
            }
          }
        }
      }
    }

    // i can't find the current color palette :/ 
    const bg_color = LiteGraph.WIDGET_BGCOLOR
    const fg_color = LiteGraph.WIDGET_TEXT_COLOR
    const fg_color2 = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR
    const outline_color = LiteGraph.WIDGET_OUTLINE_COLOR

    const a = [ button_class, text_input_class ]
    a.forEach((klass) => {
      update_css(`.${klass}`, [
        'background-color', bg_color,
        'color', fg_color2,
        'border', `none`
      ])
  
      update_css(`.${klass}:hover`, [
        'background-color', bg_color,
        'color', fg_color,
        'border', `1px solid ${outline_color}`
      ])
    })
  }

  set_filename(filename) {
    const { dandy } = this
    this.filename_input.value = filename
    dandy.filename = filename
    dandy.node.properties.filename = filename
  }

  completely_hide_tray() {
    const { div } = this
    div.style.display = 'none'
  }
}

export class DandyEditor extends DandyNode {
  static i_editor = 0

  constructor(node, app, mimetype) {
    super(node, app)
    this.mimetype = mimetype
    this.editor_class = 'dandy-editor'
    this.editor = null
    this.div_widget = null
    this.chain = null
    this.when_editor_ready_q = []
    
    const node_type = 'dandy_editor'
    const editor_id = `${node_type}_${DandyEditor.i_editor++}`

    if (node.properties === undefined) {
      node.properties = {
        brand_new_node: true,
        text: '',
        filename: ''
      }
    }
    
    this.log("NODE", node)
    this.hash_dealer = new DandyHashDealer(this)
    const socket = this.socket = new DandySocket(this)
    socket.on_sending_input = () => {}
    const service_id_widget = this.find_widget(DandyNames.SERVICE_ID)
    service_id_widget.size = [0, 0]
    const hash_widget = this.find_widget(DandyNames.HASH)
    hash_widget.size = [0, 0]
    this.init_widgets_above_editor()
    new DandyIncredibleShrinkingWidget(node, -15)

    const dandy_div = this.dandy_div = document.createElement('div')
    dandy_div.classList.add('dandyEditorContainer')
    
    this.button_bar = new DandyEditorTopBar(this, dandy_div)

    const div_widget = this.add_dom_widget(dandy_div.id, "div", dandy_div, {}, () => { this.on_editor_ready() })

    this.when_editor_ready(() => {
      const editor_pre = this.editor_pre = document.createElement('pre')
      editor_pre.classList.add(this.editor_class)
      editor_pre.id = editor_id
      editor_pre.classList.add('dandyEditorPre')
      
      dandy_div.appendChild(editor_pre)
      
      div_widget.dandy_div = dandy_div
      div_widget.editor_pre = editor_pre
      this.div_widget = div_widget
  
      const editor = ace.edit(editor_id)
      this.editor = editor
  
      dandy_div.addEventListener("keyup", (event) => {
        if (event.key === "F11" && editor.isFocused()) {
          this.toggleFullscreen()
        }
      })
  
      const when_settings_ready = async () => {
        await wait_for_DandySettings()
        const settings = dandy_settings()
        settings.learn_default_ace_keyboard(editor.getKeyboardHandler())
        settings.register_dandy(this)
      }
      when_settings_ready();

      editor_pre.addEventListener('resize', (event) => {
        editor.resize()
      })
  
      let typingTimer
      const oneSecond = 1000
  
      const handleTextChange = () => {
        clearTimeout(typingTimer)
  
        typingTimer = setTimeout(() => {
          this.apply_text()
        }, oneSecond)
      }
  
      const editor_session = editor.getSession()
      editor_session.on('change', handleTextChange)
    })  
  }

  when_editor_ready(f) {
    if (this.editor) {
      f()
    } else {
      this.when_editor_ready_q.push(f)
    }
  }

  on_editor_ready() {
    this.when_editor_ready_q.forEach(f => f())
  }

  completely_hide_tray() {
    this.button_bar.completely_hide_tray()
  }

  init_widgets_above_editor() {
  }

  on_removed() {
    dandy_settings().unregister_dandy(this)
  }

  on_settings_applied() {

  }

  toggleFullscreen() {
    const { dandy_div } = this
    const fs = 'dandyEditorFullscreen'
    if (!document.fullscreenElement) {
      dandy_div.classList.add(fs)
      dandy_div.requestFullscreen()
    } else {
      dandy_div.classList.remove(fs)
      document.exitFullscreen()
    }
  }

  apply_styles() {
    this.button_bar.apply_styles()
  }
  
  async load_file(file) {
    const { name } = file
    this.filename = name
    this.filename_widget.widget.value = name
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      this.set_text(text)
    }

    reader.readAsText(file)
  }

  on_configure(info) {
    // restore saved text if it exists
    const { button_bar, node } = this
    const { properties } = node
    const { text = "", filename = "" } = properties
    properties.brand_new_node = false

    this.when_editor_ready(() => {
      this.set_text(text)
    })

    // this.debug_log(`Editor configured`, node)
    button_bar.set_filename(filename)
  }

  apply_text() {
    this.when_editor_ready(() => {
      const { editor, node, chain, hash_dealer } = this
      const { properties } = node
      const text = editor.getValue()
      properties.text = text
  
      hash_dealer.message = text
  
      if (chain) {
        this.text_blob = new Blob([text], { type: this.mimetype })
        if (this.text_url !== null) {
          URL.revokeObjectURL(this.text_url)
        }
        this.text_url = URL.createObjectURL(this.text_blob)
        chain.contributions = this.text_url
        chain.update_chain()
      }
    })
  }

  set_text(text) {
    this.when_editor_ready(() => {
      const { editor } = this
      editor.setValue(text)
      editor.clearSelection()
      editor.resize()
      editor.renderer.updateFull()
      // seems to be a bug in ace editor that's existed since 2015, it won't update if it's off the screen.
      this.apply_text()
    })
  }
}

export class DandyJs extends DandyEditor {
  constructor(node, app) {
    super(node, app, Mimes.JS)
    this.chain = new DandyJsChain(this, 1, 1)

    node.size = [400, 300]
    
    this.when_editor_ready(() => {
      const { editor } = this
      const editor_session = editor.getSession()
      editor_session.setMode('ace/mode/javascript')
    })
  }
    
  init_widgets_above_editor() {
    dandy_js_plain_module_toggle(this)
  }
}

export class DandyHtml extends DandyEditor {
  static default_text = `<html>
  <head class='dandyMax'></head>
  <body class='dandyMax'>
    <canvas id='my_canvas' width='512' height='512'></canvas>
  </body>
</html>`

  constructor(node, app) {
    super(node, app, Mimes.HTML)
    this.chain = new DandyHtmlChain(this, 0, 1)
    node.size = [700, 280]

    this.when_editor_ready(() => {
      const { editor } = this
      const editor_session = editor.getSession()
      editor_session.setMode('ace/mode/html')
      this.set_text(DandyHtml.default_text)
    })
      
  }
}

export class DandyCss extends DandyEditor {
  static default_text = `body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}`

  constructor(node, app) {
    super(node, app, Mimes.CSS)
    this.chain = new DandyCssChain(this, 1, 1)
    node.size = [300, 280]

    this.when_editor_ready(() => {
      const { editor } = this
      const editor_session = editor.getSession()
      editor_session.setMode('ace/mode/css')
      this.set_text(DandyCss.default_text)
    })
  }
}

export class DandyJson extends DandyEditor {
  static default_text = `{
}`

  constructor(node, app) {
    super(node, app, Mimes.JSON)
    this.chain = new DandyJsonChain(this, 1, 1)
    node.size = [300, 280]
    
    this.when_editor_ready(() => {
      const { editor } = this
      const editor_session = editor.getSession()
      editor_session.setMode('ace/mode/json')
      this.set_text(DandyJson.default_text)
    })
  }

}

export class DandyYaml extends DandyEditor {
  constructor(node, app) {
    super(node, app, Mimes.YAML)
    this.chain = new DandyYamlChain(this, 1, 1)
    node.size = [300, 280]
    
    this.when_editor_ready(() => {
      const { editor } = this
      const editor_session = editor.getSession()
      editor_session.setMode('ace/mode/yaml')
      this.set_text("")
    })
  }
}

class DandyPrimativeEditor extends DandyEditor {
  constructor(node, app, mimetype, io_key) {
    super(node, app, mimetype)
    this.debug_verbose = false
    this.chain = null
    this.io_key = io_key
    
    this.when_editor_ready(() => {
      const { editor } = this
      const editor_session = editor.getSession()
      editor_session.setMode('ace/mode/text')
      this.set_text("")
    })

    const { socket } = this
    socket.on_sending_input = (o) => {
      this.when_editor_ready(() => {
        const { input, py_client } = o
        const { chain, io_key } = this
        const input_data = this.cast(input[io_key])
        //this.warn_log("on socket: input_data", input_data, input, io_key)
        const output_data = this.collect_and_output(input_data)
        chain.output_update_ignoring_input(output_data)
        const output = {}
        output[io_key] = output_data
        socket.thanks(py_client, output)
      })
    }
    node.size = NICE_SMALL_EDITOR_SIZE
  }

  cast(data) {
    return data
  }

  collect_and_output(input_data) {
    const { editor } = this
    const out = []
    if (input_data !== undefined) {
      out.push(input_data)
    }
    const data = this.cast(editor.getValue())
    out.push(data)
    return out
  }

  on_settings_applied() {
    this.when_editor_ready(() => {
      const { editor } = this
      editor.setOption('showGutter', false)
      editor.setOption('wrap', 'free')
      editor.setOption('indentedSoftWrap', false)
    })
  }

  apply_text() {
    this.when_editor_ready(() => {
      const { editor, node, chain, hash_dealer } = this
      const { properties } = node
      const text = editor.getValue()
      const data = this.cast(text)

      properties.text = text
  
      hash_dealer.message = data
  
      if (chain) {
        chain.contributions = data
        chain.update_chain()
      }
    })
  }
}

export class DandyString extends DandyPrimativeEditor {
  constructor(node, app) {
    super(node, app, Mimes.STRING, 'string')
    this.debug_verbose = false
    this.chain = new DandyStringChain(this, 1, 1)
  }
  
  collect_and_output(input_data) {
    const { editor } = this
    let out_string = ''
    if (input_data !== undefined) {
      out_string += input_data
    }
    const text = editor.getValue()
    out_string += text
    return out_string
  }
}

export class DandyInt extends DandyPrimativeEditor {
  constructor(node, app) {
    super(node, app, Mimes.INT, 'int')
    this.debug_verbose = false
    this.chain = new DandyIntChain(this, 1, 1)
  }

  cast(data) {
    const a = `${data}`
      .split(',')
      .map((s, i) => parseInt(s, 10))
      .filter((x) => !isNaN(x))
    
    return a.length === 0 ? undefined :
           a.length === 1 ? a[0] :
           a
  }
}

export class DandyFloat extends DandyPrimativeEditor {
  constructor(node, app) {
    super(node, app, Mimes.FLOAT, 'float')
    this.debug_verbose = false
    this.chain = new DandyFloatChain(this, 1, 1)
  }

  cast(data) {
    const a = `${data}`
      .split(',')
      .map((s, i) => parseFloat(s))
      .filter((x) => !isNaN(x))
    
    return a.length === 0 ? undefined :
           a.length === 1 ? a[0] :
           a
  }
}