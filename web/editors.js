import { DandyJsChain } from "./chains.js"

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
  ]

  for (let i = 0; i < features_and_codes.length; i += 2) {
    const feature = features_and_codes[i]
    const js_ = features_and_codes[i + 1]
    const response = await fetch(`${dandy_webroot}ace/${js_}`)
    const text = await response.text()
    const blob = new Blob([text], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    ace.config.setModuleUrl(`ace/${feature}`, url)
    //console.log(`ace.config.setModuleUrl("ace/${feature}", ${url})`)
  }
}

// ========================================================================
export class DandyEditor {
  static i_editor = 0

  constructor(node, app) {
    this.node = node
    this.app = app
    
    this.editor = null
    this.widget = null
    if (node.properties === undefined) {
      node.properties = {}
    }

    const node_type = 'dandy_editor'
    const editor_id = `${node_type}_${DandyEditor.i_editor++}`

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

    // restore saved text if it exists
    const { editor_text } = node.properties
    if (editor_text !== undefined) {
      this.set_text(editor_text)
    }
    
  }

  // override
  apply_text() {
  }

  set_text(text) {
    const { editor, node } = this
    editor.setValue(text)
    editor.clearSelection()
    editor.resize()
    node.properties.editor_text = text
    this.apply_text()
  }

}

export class DandyJs extends DandyEditor {
  constructor(node, app) {
    super(node, app)
    const { editor } = this
    node.size = [400, 300]
    this.js_chain = new DandyJsChain(this, node, app)
    this.js_url = null
    this.js_blob = null

    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/javascript')
  }

  apply_text() {
    const { js_chain } = this
    const { editor_text } = this.node.properties
    this.js_blob = new Blob([editor_text], { type: 'application/javascript' })
    if (this.js_url !== null) {
      URL.revokeObjectURL(this.js_url)
    }
    this.js_url = URL.createObjectURL(this.js_blob)
    console.log("apply_js()", this.js_url)
    js_chain.contributions = this.js_url
    js_chain.update_chain()
  }
}

export class DandyP5JsSetup extends DandyJs {
  static default_text = `function setup() {
  noLoop()
  createCanvas(dandy.width, dandy.height)
}`

  constructor(node, app) {
    super(node, app)
    node.size = [400, 180]
    const { editor_text } = node.properties
    if (editor_text === undefined) {
      this.set_text(DandyP5JsSetup.default_text)
    }
  }
}

export class DandyP5JsDraw extends DandyJs {
  static default_text = `function draw() {
  background(0, 0, 0)
}`

  constructor(node, app) {
    super(node, app)
    node.size = [300, 180]
    const { editor_text } = node.properties
    if (editor_text === undefined) {
      this.set_text(DandyP5JsDraw.default_text)
    }
  }
}

export class DandyHtml extends DandyEditor {
  static default_text = `<html>
  <head></head>
  <body>
    <canvas id='my_canvas' width='\${dandy.width}' height='\${dandy.height}'></canvas>
  </body>
</html>`

  constructor(node, app) {
    super(node, app)
    const { editor } = this
    node.size = [600, 180]
    
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/html')

    const { editor_text } = node.properties
    if (editor_text === undefined) {
      this.set_text(DandyHtml.default_text)
    }
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
    super(node, app)
    const { editor } = this
    node.size = [300, 180]
    
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/css')

    const { editor_text } = node.properties
    if (editor_text === undefined) {
      this.set_text(DandyCss.default_text)
    }
  }
}

export class DandyJson extends DandyEditor {
  static default_text = `{
}`

  constructor(node, app) {
    super(node, app)
    const { editor } = this
    node.size = [300, 180]
    
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/json')

    const { editor_text } = node.properties
    if (editor_text === undefined) {
      this.set_text(DandyJson.default_text)
    }
  }
}

export class DandyYaml extends DandyEditor {
  constructor(node, app) {
    super(node, app)
    const { editor } = this
    node.size = [300, 180]
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/yaml')
  }
}