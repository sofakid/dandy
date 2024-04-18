import { DandyTown, DandyJsModuleData, DandyJsClassicData } from "/extensions/dandy/dandytown.js"

export class DandyGradient extends DandyTown {
  constructor(node, app) {
    super(node, app)
    this.debug_verbose = true
    const { properties } = node
    properties.c1 = 'red'
    properties.c2 = 'blue'

    this.debug_log("constructed, reloading iframe")
    this.reload_iframe()
  }

  // we don't have input on in this node, but queuing the prompt will still deliver inputs
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

  // we do this so we can persist the colors chosen, writing it to properties keeps them
  on_message(o) {
    const { properties } = this.node
    const { command } = o
    
    console.log("GOT MESAGE ", o)
    if (command === 'get_colors') {
    console.log("GOT BIRDS ")

      const { c1, c2 } = properties
      console.log("GOT DOGS ", c1, c2)
      this.send_message({ command: 'delivering_colors', c1, c2 })
      console.log("GOT DONKEYS ")
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