import { DandyJsChain, DandyCssChain, DandyHtmlChain, DandyJsonChain, DandyYamlChain } from "/extensions/dandy/chains.js"
import { Mimes, DandyNode } from "/extensions/dandy/dandymisc.js"

const dandy_webroot = "/extensions/dandy/"

export const initDandyEditors = async () => {
  // comfyui will try to load these if we leave them as .js files.
  // but ace wants to load them its own way,
  // so we rename them to .js_ and map the features here
  const features_and_codes = [
    "theme/twilight", "theme-twilight.js_",
    "theme/cloud9_day", "theme-cloud9_day.js_",
    "theme/crimson_editor", "theme-crimson_editor.js_",
    "mode/javascript", "mode-javascript.js_",
    "mode/html", "mode-html.js_",
    "mode/css", "mode-css.js_",
    "mode/json", "mode-json.js_",
    "mode/yaml", "mode-yaml.js_",
    "mode/javascript_worker", "worker-javascript.js_",
    "mode/html_worker", "worker-html.js_",
    "mode/css_worker", "worker-css.js_",
    "mode/json_worker", "worker-json.js_",
    "mode/yaml_worker", "worker-yaml.js_",
  ]

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
export class DandyEditor extends DandyNode {
  static i_editor = 0

  constructor(node, app, mimetype) {
    super(node, app)
    this.mimetype = mimetype
    
    this.editor = null
    this.widget = null
    this.chain = null
    
    const node_type = 'dandy_editor'
    const editor_id = `${node_type}_${DandyEditor.i_editor++}`

    if (node.properties === undefined) {
      node.properties = {
        brand_new_node: true,
        text: ''
      }
    }

    const dandy_div = document.createElement('div')
    dandy_div.classList.add('dandy_node')
    
    const widget = node.addDOMWidget(dandy_div.id, "div", dandy_div)
    const editor_pre = document.createElement('pre')
    editor_pre.classList.add('dandy-editor')
    editor_pre.id = editor_id
    editor_pre.style.width = '100%'
    editor_pre.style.height = '100%'
    editor_pre.style.marginTop = '0px'
    editor_pre.style.marginBottom = '0px'
    
    dandy_div.appendChild(editor_pre)
    
    widget.dandy_div = dandy_div
    widget.editor_pre = editor_pre
    this.widget = widget

    const editor = ace.edit(editor_id)
    this.editor = editor
    editor.setTheme('ace/theme/twilight')
    editor.setOptions({
      useSoftTabs: true,
      tabSize: 2
    })
    
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
    this.chain = new DandyJsChain(this)
    node.size = [400, 300]

    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/javascript')
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

    this.set_text(DandyP5JsDraw.default_text)
  }
}

export class DandyHtml extends DandyEditor {
  static default_text = `<html>
  <head></head>
  <body>
    <canvas id='my_canvas'></canvas>
  </body>
</html>`

  constructor(node, app) {
    super(node, app, Mimes.HTML)
    this.chain = new DandyHtmlChain(this)
    node.size = [700, 180]

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
    super(node, app, Mimes.HTML)
    this.chain = new DandyCssChain(this)
    node.size = [300, 180]

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
    this.chain = new DandyJsonChain(this)
    node.size = [300, 180]
    
    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/json')

    this.set_text(DandyJson.default_text)
  }

}

export class DandyYaml extends DandyEditor {
  constructor(node, app) {
    super(node, app, Mimes.YAML)
    this.chain = new DandyYamlChain(this)
    node.size = [300, 180]
    
    const { editor } = this
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/yaml')
    this.set_text("")
  }
}