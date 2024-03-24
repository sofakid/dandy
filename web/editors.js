import { DandyJsChain } from "/extensions/dandy/js_chain.js"

// ========================================================================
export class DandyEditor {
  static i_editor = 0

  constructor(node, app) {
    this.node = node
    this.app = app
    this.js_chain = new DandyJsChain(this, node, app)
    this.js_url = null
    this.js_blob = null
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
    const editor_session = editor.getSession()
    editor_session.setMode('ace/mode/javascript')
    
    // comfyui uses css transforms 
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
        this.apply_js()
      }, oneSecond)
    }

    // Add event listener for text change events
    editor_session.on('change', handleTextChange)

    // restore saved text if it exists
    const { dandyEditorText } = node.properties
    if (dandyEditorText !== undefined) {
      this.set_js(dandyEditorText)
    }
    
  }

  set_js(text) {
    const { editor } = this
    editor.setValue(text)
    editor.clearSelection()
    editor.resize()
    this.apply_js()
  }

  apply_js() {
    const { editor, node } = this
    const text = editor.getValue()
    
    node.properties.dandyEditorText = text

    this.js_blob = new Blob([text], { type: 'application/javascript' })
    if (this.js_url !== null) {
      URL.revokeObjectURL(this.js_url)
    }
    this.js_url = URL.createObjectURL(this.js_blob)
    const { js_chain } = this
    console.log("apply_js()", this.js_url)
    js_chain.js_urls = this.js_url
    js_chain.update_chain()
  }

}

export class DandyP5JsSetup extends DandyEditor {
  static default_text = `function setup() {
  noLoop()
  createCanvas(512, 512)
}`

  constructor(node, app) {
    super(node, app)
    node.size = [300, 180]
    const { dandyEditorText } = node.properties
    if (dandyEditorText === undefined) {
      this.set_js(DandyP5JsSetup.default_text)
    }
  }
}

export class DandyP5JsDraw extends DandyEditor {
  static default_text = `function draw() {
  background(0, 0, 0)
}`

  constructor(node, app) {
    super(node, app)
    node.size = [300, 180]
    const { dandyEditorText } = node.properties
    if (dandyEditorText === undefined) {
      this.set_js(DandyP5JsDraw.default_text)
    }
  }
}

