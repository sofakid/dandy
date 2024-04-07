import { DandySocket } from "/extensions/dandy/socket.js"
import { IO, DandyJsChain, DandyCssChain, DandyHtmlChain, 
         DandyJsonChain, DandyYamlChain, DandyStringChain } from "/extensions/dandy/chains.js"
import { Mimes, DandyNode, dandy_js_plain_module_toggle } from "/extensions/dandy/dandymisc.js"
import { ace_themes, ace_keyboards, dandy_settings } from "/extensions/dandy/editor_settings.js"
import { ComfyWidgets } from "/scripts/widgets.js"

const dandy_webroot = "/extensions/dandy/"

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
}

class DandyEditorTopBar {
  constructor(dandy, parent) {
    this.dandy = dandy
    const bar_class = this.button_class = 'dandyEditorButtonBar'
    const button_class = this.button_class = 'dandyEditorButton'
    
    const div = this.div = document.createElement('div')
    div.classList.add(bar_class)

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

    const open_button = document.createElement('button')
    open_button.classList.add(button_class)
    open_button.onclick = () => {
      file_input.click()
      file_input.value = null
    }
    open_button.innerHTML = "load file..."

    div.appendChild(open_button)
    div.appendChild(save_button)
    parent.appendChild(div)
  }

  apply_styles() {
    const { dandy, button_class } = this

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

    //const editor_styles = window.getComputedStyle(editor_pre)
    // const bg_color = editor_styles.backgroundColor
    // const fg_color = editor_styles.color
    
    // i can't find the current color palette :/ 
    const bg_color = LiteGraph.WIDGET_BGCOLOR
    const fg_color = LiteGraph.WIDGET_TEXT_COLOR
    const fg_color2 = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR
    const outline_color = LiteGraph.WIDGET_OUTLINE_COLOR

    update_css(`.${button_class}`, [
      'background-color', bg_color,
      'color', fg_color2,
      'border', `none`
    ])

    update_css(`.${button_class}:hover`, [
      'background-color', bg_color,
      'color', fg_color,
      'border', `1px solid ${outline_color}`
    ])
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
    
    const node_type = 'dandy_editor'
    const editor_id = `${node_type}_${DandyEditor.i_editor++}`

    if (node.properties === undefined) {
      node.properties = {
        brand_new_node: true,
        text: ''
      }
    }
    
    this.init_widgets_above_editor()

    this.filename = ''
    const filename_widget = this.filename_widget = ComfyWidgets.STRING(node, 'filename', 
      ['', { default:'', multiline: false, serialize: true }], app)
  
    filename_widget.widget.callback = (text) => {
      this.filename = text
    }
    filename_widget.widget.computeSize = () => [0, 10]

    const dandy_div = this.dandy_div = document.createElement('div')
    dandy_div.classList.add('dandyEditorContainer')
    
    this.button_bar = new DandyEditorTopBar(this, dandy_div)

    const div_widget = node.addDOMWidget(dandy_div.id, "div", dandy_div)

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

    const settings = dandy_settings()
    settings.learn_default_ace_keyboard(editor.getKeyboardHandler())
    settings.register_dandy(this)
    
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
  }

  init_widgets_above_editor() {
  }

  on_removed() {
    dandy_settings().unregister_dandy(this)
  }

  toggleFullscreen() {
    const { editor, dandy_div } = this
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
    const { node } = this
    const { properties } = node
    const { text } = properties
    properties.brand_new_node = false
    if (text !== undefined) {
      this.set_text(text)
    } else {
      this.set_text("")
    } 
  }

  apply_text() {
    const { editor, node, chain } = this
    const { properties } = node
    const text = editor.getValue()
    properties.text = text

    if (chain) {
      this.text_blob = new Blob([text], { type: this.mimetype })
      if (this.text_url !== null) {
        URL.revokeObjectURL(this.text_url)
      }
      this.text_url = URL.createObjectURL(this.text_blob)
      chain.contributions = this.text_url
      chain.update_chain()
    }
  }
 
  set_text(text) {
    const { editor } = this
    editor.setValue(text)
    editor.clearSelection()
    editor.resize()
    this.apply_text()
  }
}

export class DandyJs extends DandyEditor {
  constructor(node, app) {
    super(node, app, Mimes.JS)
    this.chain = new DandyJsChain(this, IO.IN_OUT)
    node.size = [400, 300]
    
    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/javascript')
  }
  
  init_widgets_above_editor() {
    dandy_js_plain_module_toggle(this)
  }
}

export class DandyP5JsSetup extends DandyJs {
  static default_text = `function setup() {
  noLoop()
  createCanvas(dandy.width, dandy.height)
}`
  constructor(node, app) {
    super(node, app, Mimes.JS)
    node.size = [400, 180]
    dandy_js_plain_module_toggle(this)

    this.set_text(DandyP5JsSetup.default_text)
  }
}

export class DandyP5JsDraw extends DandyJs {
  static default_text = `function draw() {
  background(0, 0, 0)
}`

  constructor(node, app) {
    super(node, app, Mimes.JS)
    node.size = [300, 180]
    dandy_js_plain_module_toggle(this)

    this.set_text(DandyP5JsDraw.default_text)
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
    this.chain = new DandyHtmlChain(this, IO.OUT)
    node.size = [700, 280]

    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/html')

    this.set_text(DandyHtml.default_text)
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
    this.chain = new DandyCssChain(this, IO.IN_OUT)
    node.size = [300, 280]

    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/css')

    this.set_text(DandyCss.default_text)
  }
}

export class DandyJson extends DandyEditor {
  static default_text = `{
}`

  constructor(node, app) {
    super(node, app, Mimes.JSON)
    this.chain = new DandyJsonChain(this, IO.IN_OUT)
    node.size = [300, 280]
    
    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/json')

    this.set_text(DandyJson.default_text)
  }

}

export class DandyYaml extends DandyEditor {
  constructor(node, app) {
    super(node, app, Mimes.YAML)
    this.chain = new DandyYamlChain(this, IO.IN_OUT)
    node.size = [300, 280]
    
    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/yaml')
    this.set_text("")
  }
}

export class DandyPrompt extends DandyEditor {
  constructor(node, app) {
    super(node, app, Mimes.CLIP)
    const string_chain = this.string_chain = new DandyStringChain(this, IO.IN_OUT)
    node.size = [300, 280]
    
    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/text')
    this.set_text("")

    const socket = this.socket = new DandySocket(this)
    socket.on_request_string = (o) => {
      o.string = string_chain.data.map((x) => x.value).join('\n')
      socket.deliver_string(o)
    }
  }

  apply_text() {
    const { editor, node, string_chain } = this
    const { properties } = node
    const text = editor.getValue()
    properties.text = text
    console.log("WORPY", string_chain)
    if (string_chain) {
      string_chain.contributions = text
    }
  }
}