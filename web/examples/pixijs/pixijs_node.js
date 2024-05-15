import { DandyTown, DandyJsModuleData, DandyJsClassicData } from "/extensions/dandy/dandytown.js"

export class DandyPixiJs extends DandyTown {
  constructor(node, app) {
    super(node, app)
    this.debug_verbose = false
    
    node.properties.options = null
    node.properties.order = null

    this.width = 512
    this.height = 512

    const set_size_and_reload = () => {
      this.resize_to_fit()
      this.reload_iframe()
    }
    
    set_size_and_reload()
  }

  resize_to_fit() {
    const { width, height, node } = this
    let w = width + 285
    let h = height + 50
    node.setSize([w, h])
  }

  get js_data() {
    return [
      DandyJsClassicData("/extensions/dandy/examples/pixijs/lilgui.v19.js_"),
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

  // this is called when litegraph reloads the node's properties (like when reloading the page)
  // (in litegraph, configure is the opposite of serialize)
  on_configure() {
    this.deliver_options()
  }

  deliver_options() {
    const { options, order } = this.node.properties

      // we don't send options if they aren't configured yet, or if the user hasn't made any changes anyways
      // (we save options whenever they change a value)
      if (options === null) {
        this.send_message({ command: 'delivering_null_options'})
      } else {
        this.send_message({ command: 'delivering_options', options, order })
      }


  }

  on_message(o) {
    const { properties } = this.node
    const { command } = o
    
    if (command === 'get_options') {
      this.deliver_options()
      return
    }

    if (command === 'save_options') {
      properties.options = o.options
      properties.order = o.order
      this.hash_dealer.salt()
      return
    }
  }

  on_input() {
    super.on_input()
    const { input } = this
    this.width = input.width
    this.height = input.height
    this.resize_to_fit()
  }

  async make_dandy_o() {
    const dandy_o = await super.make_dandy_o()
    dandy_o.width = this.width
    dandy_o.height = this.height
    return dandy_o
  }
}