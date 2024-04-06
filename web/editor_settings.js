import { ace_keyboards, ace_themes, dandy_settings } from '/extensions/dandy/editors.js'
import { DandyNames, DandyNode } from '/extensions/dandy/dandymisc.js'

const settings = dandy_settings()

const mandatories = {
  hasCssTransforms: true,
  showPrintMargin: false,
  scrollPastEnd: false,
}

const default_font = 'monospace'

const setto_names = []
const setto = {}
const setty_combo = (name, default_value, values) => {
  const x = setto[name] = {}
  x.default = default_value
  x.values = values
  x.type = 'combo'  
  setto_names.push(name)
}

const setty_booly = (name, default_value) => {
  const x = setto[name] = {}
  x.default = default_value
  x.type = 'boolean'
  setto_names.push(name)
}

const setty_numby = (name, default_value, min_val, max_val) => {
  const x = setto[name] = {}
  x.default = default_value
  x.type = 'number'
  setto_names.push(name)
}

const setty_wordy = (name, default_value, min_val, max_val) => {
  const x = setto[name] = {}
  x.default = default_value
  x.type = 'string'
  setto_names.push(name)
}

const setty_fonty = (name) => {
  const x = setto[name] = {}
  x.default = default_font
  x.type = 'font'
  setto_names.push(name)
}

const default_keyboard = 'ace'
const default_theme = 'twilight'
setty_combo('keyboardHandler', default_keyboard, ace_keyboards)
setty_combo('theme', default_theme, ace_themes)
setty_booly('highlightActiveLine', true)
setty_booly('highlightSelectedWord', true)
setty_combo('cursorStyle', 'ace', ['ace', 'slim', 'smooth', 'wide'])
setty_booly('useSoftTabs', true)
setty_booly('navigateWithinSoftTabs', true)
setty_numby('tabSize', 2, 1, 10)
setty_booly('enableMultiselect', true)
setty_booly('enableAutoIndent', true)
setty_booly('enableKeyboardAccessibility', true)
setty_booly('highlightGutterLine', true)
setty_booly('animatedScroll', true)
setty_booly('showInvisibles', false)

setty_booly('fadeFoldWidgets', true)
setty_booly('showFoldWidgets', true)
setty_booly('showGutter', true)
setty_booly('displayIndentGuides', true)
setty_booly('highlightIndentGuides', true)

setty_numby('fontSize', 12, 6, 32)
setty_fonty('fontFamily')
setty_booly('fixedWidthGutter', false)
setty_booly('useSvgGutterIcons', true)
setty_numby('scrollSpeed', 1, 0.1, 10)
setty_numby('dragDelay', 1, 0.1, 10)
setty_booly('dragEnabled', true)
setty_combo('newLineMode', 'auto', ['auto', 'unix', 'windows'])
setty_combo('wrap', 'off', ['off', 'free'])
setty_booly('indentedSoftWrap', true)
setty_combo('foldStyle', 'markbegin', ['markbegin', 'markbeginend', 'manual'])

export class DandyEditorSettings extends DandyNode {
  constructor(node, app) {
    super(node, app)
    this.node.size = [400, 500]
    this.options = {}
    Object.entries(setto).forEach(([name, x]) => {
      if (x.type === 'combo') {
        this.combo_widget(name, x)
      }
      else if (x.type === 'boolean') {
        this.boolean_widget(name, x)
      }
      else if (x.type === 'number') {
        this.number_widget(name, x)
      }
      else if (x.type === 'string') {
        this.string_widget(name, x)
      }
      else if (x.type === 'font') {
        this.font_widget(name, x)
      }
    })
  }

  font_widget(name, o) {
    o.values = settings.fonts
    console.warn("HERE")
    this.combo_widget(name, o)  
  }

  combo_widget(name, o) {
    const { node, options } = this
    const widget = node.addWidget('combo', name, o.default, 
      (x) => {
        options[name] = x
        this.apply_settings()
      }, { values: o.values })
    this[`${name}_widget`] = widget
    options[name] = o.default
  }

  boolean_widget(name, o) {
    const { node, options } = this
    const widget = node.addWidget('toggle', name, o.default, 
      (x) => {
        options[name] = x
        this.apply_settings()
      }, { on: 'true', off: 'false' })
    this[`${name}_widget`] = widget
    options[name] = o.default
  }

  number_widget(name, o) {
    const { node, options } = this
    const widget = node.addWidget('number', name, o.default, 
      (x) => {
        options[name] = x
        this.apply_settings()
      }, {})
    this[`${name}_widget`] = widget
    options[name] = o.default
  }

  string_widget(name, o) {
    const { node, options } = this
    const widget = node.addWidget('string', name, o.default, 
      (x) => {
        options[name] = x
        this.apply_settings()
      }, {})
    this[`${name}_widget`] = widget
    options[name] = o.default
  }

  on_configure() {
    setto_names.forEach((name) => {
      const widget = this[`${name}_widget`]
      if (!widget) {
        console.warn(`DandyEditorSettings :: no widget for ${name}`)
        return  
      }
      this.options[name] = widget.value
    })
    super.on_configure()
  }

  apply_text() {
    const { editor, node } = this
    const { properties } = node
    const text = editor.getValue()
    properties.text = text
    this.apply_settings()
  }

  apply_settings() {
    const { editor, options } = this
    // const text = editor.getValue()
    // const o = jsyaml.load(text)

    // if (o) {
    const o = {}
    
    setto_names.forEach((name) => {
      const s = options[name]
      if (name === 'keyboardHandler') {
        o[name] = `ace/keyboard/${s}`
      } else if (name === 'theme') {
        o[name] = `ace/theme/${s}`
      // } else if (s === 'true') {
      //   o[name] = true
      // } else if (s === 'false') {
      //   o[name] = false
      // } else if (/^\d+$/.test(s)) {
      //   o[name] = parseInt(s)
      } else {
        o[name] = s
      }
    })

    Object.entries(mandatories).forEach(([name, value]) => {
      o[name] = value
    })

    settings.set_options(o)
  }
}