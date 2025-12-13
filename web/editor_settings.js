import { DandyNode, dandy_delay } from '/extensions/dandy/dandymisc.js'
import { DandySocket } from "/extensions/dandy/socket.js"

const mandatories = {
  hasCssTransforms: true,
  showPrintMargin: false,
  scrollPastEnd: false,
}

const default_keyboard = 'ace'
const default_theme = 'twilight'
const default_font = 'Courier New'
const default_options = {}

Object.assign(default_options, mandatories)

export const ace_themes = [
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

export const ace_keyboards = [ 'ace', 'emacs', 'sublime', 'vim', 'vscode' ]

let MONOSPACED_ANALYSED = false
const collect_monospace_fonts = (system_fonts) => {
  const monospaced = []

  const text = "1ixXmMzZ_()lW.,|"
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // remove duplicates
  const fonts = [...new Set(system_fonts)]
  fonts.forEach((font) => {
    ctx.font = `16px ${font}`
    const reference_width = ctx.measureText('i').width
  
    let is_monospaced = true
    for (let i = 0, n = text.length; i < n; ++i) {
      const char = text.charAt(i)
      const char_width = ctx.measureText(char).width;
      if (Math.abs(char_width - reference_width) > 1) {
        is_monospaced = false
        break
      }
    }
    if (is_monospaced) {
      monospaced.push(font)
    }
  })

  MONOSPACED_ANALYSED = true
  return monospaced.sort()
}


const setto_names = []
const setto = {}
const setty_combo = (name, default_value, values) => {
  const x = setto[name] = {}
  x.default = default_value
  x.values = values
  x.type = 'combo'  
  setto_names.push(name)
  default_options[name] = default_value
}

const setty_booly = (name, default_value) => {
  const x = setto[name] = {}
  x.default = default_value
  x.type = 'boolean'
  setto_names.push(name)
  default_options[name] = default_value
}

const setty_numby = (name, default_value, min_val, max_val) => {
  const x = setto[name] = {}
  x.default = default_value
  x.min = min_val
  x.max = max_val
  x.type = 'number'
  setto_names.push(name)
  default_options[name] = default_value
}

const setty_intyy = (name, default_value, min_val, max_val) => {
  const x = setto[name] = {}
  x.default = default_value
  x.min = min_val
  x.max = max_val
  x.type = 'int'
  setto_names.push(name)
  default_options[name] = default_value
}

const setty_wordy = (name, default_value) => {
  const x = setto[name] = {}
  x.default = default_value
  x.type = 'string'
  setto_names.push(name)
  default_options[name] = default_value
}

const setty_fonty = (name) => {
  const x = setto[name] = {}
  x.default = default_font
  x.type = 'font'
  setto_names.push(name)
  default_options[name] = default_font
}

setty_combo('keyboardHandler', default_keyboard, ace_keyboards)
setty_combo('theme', default_theme, ace_themes)
setty_fonty('fontFamily')
setty_numby('fontSize', 12, 6, 32)
setty_booly('highlightActiveLine', true)
setty_booly('highlightSelectedWord', true)
setty_combo('cursorStyle', 'ace', ['ace', 'slim', 'smooth', 'wide'])
setty_booly('useSoftTabs', true)
setty_booly('navigateWithinSoftTabs', true)
setty_intyy('tabSize', 2, 1, 10)
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

setty_booly('fixedWidthGutter', false)
setty_booly('useSvgGutterIcons', true)
setty_numby('scrollSpeed', 1, 0.1, 10)
setty_numby('dragDelay', 1, 0.1, 10)
setty_booly('dragEnabled', true)
setty_combo('newLineMode', 'auto', ['auto', 'unix', 'windows'])
setty_combo('wrap', 'off', ['off', 'free'])
setty_booly('indentedSoftWrap', true)
setty_combo('foldStyle', 'markbegin', ['markbegin', 'markbeginend', 'manual'])

// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------

export class DandySettings {

  constructor() {
    this.dandies = []
    this.options = {}
    this.key_o = 'DandyEditorSettings'
    this.key_fonts = 'DandyFonts'
    this.ace_keyboard = null
    this.fonts = null
    
    const socket = this.socket = new DandySocket()
    socket.on_delivering_fonts = (fonts) => {
      console.log('DandySettings :: Fonts delivered.')
      this.fonts = collect_monospace_fonts(fonts)
      this.save_fonts_to_local_storage()
    }

    const f = async () => {
      await socket.get_service_id()
      this.load_fonts_from_local_storage()
      if (this.fonts === null) {
        this.reload_fonts()
      }
    }
    f()
    
    this.load_from_local_storage()
    this.save_to_local_storage()
  }

  async wait_until_ready() {
    while (this.fonts === null) {
      const ms = 50
      await dandy_delay(ms)
    }
  }

  reload_fonts() {
    this.socket.request_fonts()
  }

  learn_default_ace_keyboard(o_handler) {
    this.ace_keyboard = o_handler?.$id || 'ace'
  }

  load_fonts_from_local_storage() {
    const { key_fonts } = this
    const so = localStorage.getItem(key_fonts)
    if (so !== null) {
      const o = JSON.parse(so)
      this.fonts = o
    } else {
      this.fonts = null
    }
  }

  save_fonts_to_local_storage() {
    const { key_fonts, fonts } = this
    if (fonts) {
      const so = JSON.stringify(fonts)
      localStorage.setItem(key_fonts, so)
    }
  }

  load_from_local_storage() {
    const { key_o } = this
    const so = localStorage.getItem(key_o)
    if (so !== null) {
      const o = JSON.parse(so)
      const dont_save = false
      this.set_options(o, dont_save)
    } else {
      const save = true
      this.set_options(default_options, save)
    }
  }

  save_to_local_storage() {
    const { key_o, options } = this
    const so = JSON.stringify(options)
    localStorage.setItem(key_o, so)
  }

  register_dandy(dandy) {
    this.dandies.push(dandy)
    this.apply_options(dandy)
  }
  
  unregister_dandy(dandy) {
    this.dandies = this.dandies.filter((x) => x !== dandy)
  }
  
  set_options(options, save=true) {
    this.options = options
    if (save) {
      this.save_to_local_storage()
    }
    this.dandies.forEach((dandy) => {
      this.apply_options(dandy)
    })
  }

  apply_options(dandy) {
    const { editor } = dandy
    const { options } = this
    const { ace_keyboard } = settings
    
    // ace needs these ones special to load and find them
    const ace_options = {
      ...options,
      theme: `ace/theme/${options.theme}`,
      keyboardHandler: `ace/keyboard/${ace_keyboard || "ace"}`
    }

    editor.setKeyboardHandler(ace_options.keyboardHandler)
    editor.setOptions(ace_options)

    dandy.on_settings_applied(options)
  }
}

// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------

let settings = null
export const new_dandy_settings = () => {
  settings = new DandySettings()
}

export const dandy_settings = () => {
  return settings
}

export const wait_for_DandySettings = async () => {
  await settings.wait_until_ready()
}

// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------

export class DandyEditorSettings extends DandyNode {
  constructor(node, app) {
    super(node, app)
    this.options = default_options
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
      else if (x.type === 'int') {
        this.int_widget(name, x)
      }
      else if (x.type === 'string') {
        this.string_widget(name, x)
      }
      else if (x.type === 'font') {
        this.font_widget(name, x)
      }
    })
    this.reload_fonts_widget = node.addWidget(
      'button', 'reload_fonts', 'Reload Fonts', () => {
        (async () => {
          const settings = dandy_settings()
          settings.reload_fonts()
          await settings.wait_until_ready()
          this.fontFamily_widget.options.values = settings.fonts
        })();
      })

    this.load_from_settings()
    this.node.size = [280, 755]

  }

  font_widget(name, o) {
    o.values = settings.fonts
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
      }, {
        min: o.min,
        max: o.max,
      })
    this[`${name}_widget`] = widget
    options[name] = o.default
  }

  int_widget(name, o) {
    const { node, options } = this
    const widget = node.addWidget('number', name, o.default, 
      (x) => {
        options[name] = x
        this.apply_settings()
      }, { 
        min: o.min,
        max: o.max,
        step: 10,
        precision: 0,
      })
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

  load_from_settings() {
    const { options } = this
    Object.entries(settings.options).forEach(([name, v]) => {
      const widget = this[`${name}_widget`]
      if (widget) {
        widget.value = v
        options[name] = v
      }
    })
    this.apply_settings()
  }

  on_configure() {
    const { options } = this
    setto_names.forEach((name) => {
      const widget = this[`${name}_widget`]
      if (!widget) {
        console.warn(`DandyEditorSettings :: no widget for ${name}`)
        return  
      }
      options[name] = widget.value
    })
    super.on_configure()
  }

  apply_settings() {
    const o = { ...this.options }
    
    Object.entries(mandatories).forEach(([name, value]) => {
      o[name] = value
    })

    settings.set_options(o)
  }
}