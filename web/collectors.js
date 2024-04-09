import { DandyImageUrlChain, DandyIntChain, DandyBooleanChain, 
  DandyFloatChain, DandyStringChain } from "/extensions/dandy/chains.js"
import { DandyNames, DandyTypes, DandyNode, dandy_cash } from "/extensions/dandy/dandymisc.js"

export class DandyCollector extends DandyNode {
  constructor(node, app, name, type) {
    super(node, app)
    this.debug_verbose = true
    this.name = name
    this.type = type
    this.hash_widget = this.find_widget(DandyNames.HASH)
    this.hash_widget.value = dandy_cash(`${Date.now()}`)
    this.hash_widget.size = [0, -4]
    this.collection_widget = null
    this.n_inputs_widget = this.find_widget('n_inputs')
    this.n_inputs_widget.callback = (x) => {
      if (x >= 0) {
        this.chain.n_inputs = x 
      }
    }
  }

  init_after_chain() {
    const { name } = this
    this.collection_widget = this.find_widget(name)
    this.collection_widget.value = ''
  }

  get chain() {
    const { chains, type } = this
    return chains[type]
  }

  update_hash() {
    this.hash_widget.value = dandy_cash(`${this.chain.data}`)
  }

  on_configure() {
    this.update_hash()
  }

  on_connections_change(i_or_o, index, connected, link_info, input) {
    const { name, collection_widget, chain, type, node } = this 
    this.debug_log('on_connections_change(i_or_o, index, connected, link_info, input)', 
      i_or_o, index, connected, link_info, input)
    const I = 1
    const O = 2

    if (collection_widget === null) {
      // we're not constructed yet
      return
    }

    if (i_or_o === I) {
      collection_widget.value = ''
      chain.contributions = ''
    }
    this.update_hash()
  }

  on_chain_updated(type) {
    this.update_hash()
  }

  on_executed(output) {
    const { name, collection_widget, chain, type } = this 
    let value = output[name]

    if (type === 'STRING' && Array.isArray(value)) {
      value = value[0]
    }
    this.warn_log(`ON_EXECUTED :: value: <${value}>output: `, output)

    const last_value = collection_widget.value

    if (last_value !== value) {
      collection_widget.value = value
      chain.output_update_ignoring_input(value)
      this.update_hash()
      //chain.contributions = value
    }
  }
}

export class DandyImageCollector extends DandyCollector {
  constructor(node, app) {
    super(node, app, DandyNames.IMAGE_URL, DandyTypes.IMAGE_URL)
    new DandyImageUrlChain(this, 1, 1)
  }
}

export class DandyIntCollector extends DandyCollector {
  constructor(node, app) {
    super(node, app, 'int', 'INT')
    new DandyIntChain(this, 2, 1)
  }
}

export class DandyFloatCollector extends DandyCollector {
  constructor(node, app) {
    super(node, app, 'float', 'FLOAT')
    new DandyFloatChain(this, 2, 1)
  }
}

export class DandyBooleanCollector extends DandyCollector {
  constructor(node, app) {
    super(node, app, 'boolean', 'BOOLEAN')
    new DandyBooleanChain(this, 2, 1)
  }
}

export class DandyStringCollector extends DandyCollector {
  constructor(node, app) {
    super(node, app, 'string', 'STRING')
    new DandyStringChain(this, 2, 1)
  }
}