import { DandyImageUrlChain, DandyIntChain, DandyBooleanChain, DandyFloatChain, DandyStringChain } from "/extensions/dandy/chains.js"
import { DandyNames, DandyTypes, DandyNode, DandyHashDealer, ComfyTypesList, DandyWidget, ComfyTypes } from "/extensions/dandy/dandymisc.js"

const max_inputs = 100

export class DandyCollector extends DandyNode {
  constructor(node, app, name, type) {
    super(node, app)
    this.debug_verbose = true
    this.name = name
    this.type = type
    this.hash_dealer = new DandyHashDealer(this)
    this.collection_widget = null
    
    const n_inputs_widget = this.find_widget('n_inputs')
    n_inputs_widget.callback = (x) => {
      if (x >= 0) {
        this.chain.n_inputs = x
        node.size = node.computeSize()
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
    this.warn_log(`get chain() :: chains[${type}]:`, chains[type])
    return chains[type][0]
  }

  update_hash() {
    this.hash_dealer.message = this.chain.data
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

  on_chain_updated(type, chain) {
    this.update_hash()
  }

  on_executed(output) {
    const { name, collection_widget, chain, type } = this 
    let value = output[name]

    if (type in ComfyTypesList && Array.isArray(value)) {
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

export class DandyImageyCollector extends DandyCollector {
  constructor(node, app, name, type) {
    super(node, app, name, type)
    new DandyImageUrlChain(this, 1, 1)
    
    this.remove_inputs_and_widgets('n_inputs')
    
    const inty_options = {
      min: 1,
      max: max_inputs,
      step: 10,
      precision: 0,
    }

    const f_image_inputs = (n) => {
      if (n >= 0) {
        this.remove_inputs(name)
        for (let i = 0; i < n; ++i) {
          const nom = `${name}${i}`
          this.put_input_slot(nom, type)
        }
        node.size = node.computeSize()
      }
    }

    const f_url_inputs = (n) => {
      if (n >= 0) {
        this.chain.n_inputs = n
        node.size = node.computeSize()
      }
    }

    node.addWidget('number', 'n_image_inputs', 2, f_image_inputs, inty_options)
    node.addWidget('number', 'n_url_inputs', 1, f_url_inputs, inty_options)

    f_image_inputs(2)
    f_url_inputs(1)
  }

  init_after_chain() {
    this.collection_widget = this.find_widget(DandyNames.IMAGE_URL)
    this.collection_widget.value = ''
  }

  get chain() {
    return this.chains[DandyTypes.IMAGE_URL][0]
  }
}

export class DandyImageCollector extends DandyImageyCollector {
  constructor(node, app) {
    super(node, app, 'image', 'IMAGE')
  }
}

export class DandyMaskCollector extends DandyImageyCollector {
  constructor(node, app) {
    super(node, app, 'mask', 'MASK')
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