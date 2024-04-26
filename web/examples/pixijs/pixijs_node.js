import { DandyTown, DandyJsModuleData, DandyJsClassicData } from "/extensions/dandy/dandytown.js"

export class DandyPixiJs extends DandyTown {
  constructor(node, app) {
    super(node, app)
    this.debug_verbose = true
    const { properties } = node
    properties.c1 = 'red'
    properties.c2 = 'blue'

    const set_size_and_reload = () => {
      this.resize_to_fit()
      this.reload_iframe()
    }

    const { width_widget, height_widget } = this
    width_widget.callback = set_size_and_reload
    height_widget.callback = set_size_and_reload
    
    set_size_and_reload()
  }

  resize_to_fit() {
    const { width_widget, height_widget, node } = this
    let w = width_widget.value + 285
    let h = height_widget.value + 100
    node.setSize([w, h])
  }

  get js_data() {
    return [
      DandyJsClassicData("/extensions/dandy/examples/pixijs/lil-gui.js_"),
      DandyJsClassicData("/extensions/dandy/examples/pixijs/pixi.min.js_"),
      DandyJsClassicData("/extensions/dandy/examples/pixijs/pixi-filters.js_"),
      DandyJsModuleData('/extensions/dandy/examples/pixijs/src/index.mjs')
    ]
  }

  // return a list of one HTML url, dandy only uses the first one.
  // not sure what multiple htmls would mean, and we use lists for these things so here we are.
  get html_urls() {
    return [ `/extensions/dandy/examples/pixijs/index.html` ]
  }

  // we do this so we can persist the colors chosen, writing it to node.properties keeps them.
  // if we had done the color picking in a widget it would persist, but we'd be reloading each time 
  // and it's nicer this way, and shows how to send messages
  on_message(o) {
    const { properties } = this.node
    const { command } = o
    
    if (command === 'get_colors') {
      const { c1, c2 } = properties
      this.send_message({ command: 'delivering_colors', c1, c2 })
      return
    }

    if (command === 'set_colors') {
      const { c1, c2 } = o
      properties.c1 = c1
      properties.c2 = c2
      return
    }
  } 
}