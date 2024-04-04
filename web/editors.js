// import { saveAs } from '/extensions/dandy/FileSaver/FileSaver.js'
import { IO, DandyJsChain, DandyCssChain, DandyHtmlChain, 
         DandyJsonChain, DandyYamlChain } from "/extensions/dandy/chains.js"
import { Mimes, DandyNode, dandy_js_plain_module_toggle, DandyNames } from "/extensions/dandy/dandymisc.js"
import { ComfyWidgets } from "/scripts/widgets.js"

const dandy_webroot = "/extensions/dandy/"

const ace_themes = [
  'ambiance', 
  'chaos',
  'chrome',
  'cloud_editor',
  'cloud_editor_dark',
  'cloud9_day',
  'cloud9_night',
  'cloud9_night_low_color',
  'clouds',
  'clouds_midnight',
  'cobalt',
  'crimson_editor',
  'dawn',
  'dracula',
  'dreamweaver',
  'eclipse',
  'github',
  'github_dark',
  'gob',
  'gruvbox',
  'gruvbox_light_hard',
  'gruvbox_dark_hard',
  'idle_fingers',
  'iplastic',
  'katzenmilch',
  'kr_theme',
  'kuroir',
  'merbivore',
  'merbivore_soft',
  'mono_industrial',
  'monokai',
  'nord_dark',
  'one_dark',
  'pastel_on_dark',
  'solarized_light',
  'solarized_dark',
  'sqlserver',
  'terminal',
  'textmate',
  'tomorrow',
  'tomorrow_night',
  'tomorrow_night_blue',
  'tomorrow_night_bright',
  'tomorrow_night_eighties',
  'twilight',
  'vibrant_ink',
  'xcode'
]

const ace_keybindings = [ 'emacs', 'sublime', 'vim', 'vscode' ] 

export const initDandyEditors = async () => {
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

  ace_keybindings.forEach((keyboard) => {
    features_and_codes.push(`keyboard/${keyboard}`)
    features_and_codes.push(`keybinding-${keyboard}.js_`)
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

// ========================================================================

class Settings {
  constructor() {
    this.editors = []
    this.options = {
      theme: "ace/theme/twilight",
      keyboardHandler: 'vscode',
      useSoftTabs: true,
      tabSize: 2
    }
  }

  register_editor = (editor) => {
    this.editors.push(editor)
  }
  
  unregister_editor = (editor) => {
    this.editors = this.editors.filter((x) => x !== editor)
  }
  
  set_options = (options) => {
    this.options = options
    this.editors.forEach((editor) => {
      editor.setOptions(options)
    })
  }
}
const settings = new Settings()

export class DandyEditor extends DandyNode {
  static i_editor = 0

  constructor(node, app, mimetype) {
    super(node, app)
    this.mimetype = mimetype
    
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

    this.filename = ''
    const filename_widget = this.filename_widget = ComfyWidgets.STRING(node, 'filename', 
      ['', { default:'', multiline: false, serialize: true }], app)
  
    filename_widget.widget.callback = (text) => {
      this.filename = text
    }

    const save_widget = this.save_widget = node.addWidget("button", "save_button", "", () => {
      const text = this.editor.getValue()
      const blob = new Blob([text], { type: `${mimetype};charset=utf-8` })
      saveAs(blob, this.filename)
    })
    save_widget.label = "save as..."

    const file_input = this.file_input = document.createElement("input")
    const on_files_selected = async () => {
      if (file_input.files.length) {
        await this.load_file(file_input.files[0])
      }
    }

    Object.assign(file_input, {
      type: "file",
      multiple: false,
      accept: mimetype,
      style: "display: none",
      onchange: on_files_selected,
    })
    document.body.appendChild(file_input)

    const open_widget = this.open_widget = node.addWidget("button", "open_button", "", () => {
      file_input.click()
      file_input.value = null
    })
    open_widget.label = "load file..."

    this.init_widgets_above_editor()

    const dandy_div = document.createElement('div')
    dandy_div.classList.add('dandy_node')
    
    const div_widget = node.addDOMWidget(dandy_div.id, "div", dandy_div)
    const editor_pre = document.createElement('pre')
    editor_pre.classList.add('dandy-editor')
    editor_pre.id = editor_id
    editor_pre.style.width = '100%'
    editor_pre.style.height = '100%'
    editor_pre.style.marginTop = '0px'
    editor_pre.style.marginBottom = '0px'
    
    dandy_div.appendChild(editor_pre)
    
    div_widget.dandy_div = dandy_div
    div_widget.editor_pre = editor_pre
    this.div_widget = div_widget

    const editor = ace.edit(editor_id)
    this.editor = editor
    settings.register_editor(editor)
    editor.setOptions(settings.options)
    
    // LiteGraph uses css transforms 
    // without this line, cursor postion and mouse clicks won't line up
    editor.setOption('hasCssTransforms', true)

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
    settings.unregister_editor(this.editor)
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

export class DandyEditorSettings extends DandyYaml {
  static defaults = `
# Dandy Editor uses Ace editor. You can use any Ace editor options in here.
# Ace options: https://github.com/ajaxorg/ace/wiki/Configuring-Ace

useSoftTabs: true
tabSize: 2
`
  constructor(node, app) {
    super(node, app)
    this.set_text(DandyEditorSettings.defaults)
    this.remove_input_slot(DandyNames.YAML)
    this.remove_output_slot(DandyNames.YAML)
    this.node.size = [600, 280]
  }

  init_widgets_above_editor() {
    const { node } = this
    const default_keybindings = 'vscode'
    this.keybindings = default_keybindings
    this.keybindings_widget = node.addWidget(
      'combo', 'keyboard', default_keybindings, (x) => {
        this.keybindings = x
        this.apply_settings()
      }, { values: ace_keybindings })
    
    const default_theme = 'twilight'
    this.theme = default_theme
    this.theme_widget = node.addWidget(
      'combo', 'theme', default_theme, (x) => {
        this.theme = x
        this.apply_settings()
      }, { values: ace_themes })
  }

  apply_text() {
    const { editor, node } = this
    const { properties } = node
    const text = editor.getValue()
    properties.text = text
    this.apply_settings()
  }

  apply_settings() {
    const { editor } = this
    const text = editor.getValue()
    const options = jsyaml.load(text)

    if (options) {
      options.keyboardHandler = `ace/keyboard/${this.keybindings}`
      options.theme = `ace/theme/${this.theme}`
      settings.set_options(options)
    }
  }
}