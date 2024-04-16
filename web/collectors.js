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
    this.collection = []
    
    const n_inputs_widget = this.n_inputs_widget = this.find_widget('n_inputs')
    n_inputs_widget.callback = (x) => {
      if (x >= 0) {
        const { chain } = this
        const input_links = this.get_input_connections()
        chain.n_inputs = x
        chain.reconnect_input_connections(input_links)
        node.size = node.computeSize()
      }
    }
  }

  get chain() {
    const { chains, type } = this
    return chains[type][0]
  }

  // we can't do this in the chain because the chain thinks it has 2 inputs when it's created
  get_input_connections() {
    const { node, type } = this
    const { graph, inputs } = node

    const links_table = []

    if (inputs.length > 0) {
      inputs.forEach((input, i) => {
        const links_row = [] 
        if (input.type !== type) {
          links_table.push(links_row)
          return
        }

        const { link:link_id } = input
        if (link_id === null) {
          links_table.push(links_row)
          return
        }
        
        const link = graph.links[link_id]
        if (link === undefined || link === null) {
          this.debug_log(`collecting input_connections: undefined link`)
          links_table.push(links_row)
          return
        }
      
        // link can change, clone it
        const o = {...link}
        o.target_slot = i
        links_row.push(o)
        links_table.push(links_row)
      })
    }
    return links_table
  }

  update_hash() {
    this.hash_dealer.message = this.chain.data
  }

  on_configure() {
    const { n_inputs_widget } = this
    n_inputs_widget.callback(n_inputs_widget.value)
    this.update_hash()
  }

  on_connections_change(i_or_o, index, connected, link_info, input) {
    const { chain, type, node } = this 
    // this.debug_log('on_connections_change(i_or_o, index, connected, link_info, input)', 
    //   i_or_o, index, connected, link_info, input)
    const I = 1
    const O = 2

    if (chain === null) {
      // we're not constructed yet
      return
    }

    if (i_or_o === I) {
      this.last_value = []
      chain.contributions = []
    }
    this.hash_dealer.salt()
    this.update_hash()
  }

  on_chain_updated(type, chain) {
    this.update_hash()
  }

  on_executed(output) {
    const { chain } = this 
    let value = output.value[0]

    // if (type in ComfyTypesList && Array.isArray(value)) {
    //   value = value[0]
    // }

    // if (type in [DandyTypes.IMAGE_URL]) {
    //   value = value.split('\n')
    // }

    this.debug_log(`ON_EXECUTED :: value: <${value}>, output: `, output)
    
    if (this.last_value !== value) {
      this.last_value = value
      chain.output_update_ignoring_input(value)
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

    const f_imagey_inputs = (n) => {
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

    node.addWidget('number', `n_${name}_inputs`, 2, f_imagey_inputs, inty_options)
    node.addWidget('number', 'n_url_inputs', 1, f_url_inputs, inty_options)

    f_imagey_inputs(2)
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

export class DandyStringArrayCollector extends DandyCollector {
  constructor(node, app) {
    super(node, app, 'string', 'STRING')
    new DandyStringChain(this, 2, 1)
  }
}


export class DandyStringCatCollector extends DandyCollector {
  constructor(node, app) {
    super(node, app, 'string', 'STRING')
    new DandyStringChain(this, 2, 1)
  }
}