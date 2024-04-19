import { DandyTown, DandyJsModuleData, DandyJsClassicData } from "/extensions/dandy/dandytown.js"

export class DandyGradient extends DandyTown {
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
    let w = width_widget.value + 20
    let h = height_widget.value + 140
    node.setSize([w, h])
  }

  // we don't have input on in this node, but queuing the prompt will still deliver inputs.
  // we don't want to rerender and lose our gradient.
  get render_on_input() {
    return false
  }

  get js_data() {
    return [
      DandyJsClassicData('/extensions/dandy/Coloris-0.24.0/coloris.min.js'),
      DandyJsClassicData('/extensions/dandy/examples/gradient.js')
    ]
  }

  get css_urls() {
    return [
      "/extensions/dandy/Coloris-0.24.0/coloris.min.css",
      "/extensions/dandy/examples/gradient.css",
    ]
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