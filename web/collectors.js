import { DandyImageUrlChain, DandyIntChain, DandyBooleanChain, DandyFloatChain, DandyStringChain } from "/extensions/dandy/chains.js"
import { DandyNames, DandyTypes, DandyNode, DandyHashDealer } from "/extensions/dandy/dandymisc.js"

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
    n_inputs_widget.callback = (n) => {
      if (n < 1) {
        n_inputs_widget.value = 1
        n = 1
      }
      this.setup_inputs(n, type)
    }
  }

  setup_inputs(n) {
    if (n > 0) {
      const { node } = this
      chain.n_inputs = n
      node.size = node.computeSize()
    }
  }


  setup_inputs(n) {
    if (n > 0) {
      const { chain, node } = this
      const input_links = this.get_input_connections()
      chain.n_inputs = n
      this.reconnect_input_connections(input_links)
      node.size = node.computeSize()
    }
  }

  get chain() {
    const { chains, type } = this
    return chains[type][0]
  }

  // we can't do this in the chain because the chain thinks it has 2 inputs when it's created
  get_input_connections(type) {
    const { node } = this
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

  reconnect_input_connections(links_table) {
    const { graph } = this.node
    this.each_io_name((input_name, i) => {
      this.debug_log('reconnect_input_connections', i)
      const links_row = links_table[i]
      this.debug_log('reconnect_input_connections links row', i, links_row)

      if (links_row) {
        links_row.forEach((link) => {
          const { origin_id, origin_slot, target_id, target_slot } = link
          this.debug_log('reconnect_input_connections', i, origin_id, origin_slot, target_id, target_slot)

          const origin = graph.getNodeById(origin_id)
          origin.connect(origin_slot, target_id, target_slot) 
        })
      }
    })
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
    const value = output.value[0]
    const s = `${value}`.slice(0, 200)
    this.debug_log(`ON_EXECUTED :: value: <${s}>, output: `, output)
    
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
    
    this.setup_inputs(2)

    const n_inputs_widget = this.n_inputs_widget = this.find_widget('n_inputs')
    n_inputs_widget.callback = (n) => {
      if (n < 1) {
        n = 1
      }
      this.setup_inputs(n)
    }
  }

  setup_inputs(n) {
    if (n > 0) {
      const { node, name, type } = this
      if (n === 1) {
        this.rename_input_slot(`${name}0`, name)
      } else {
        this.rename_input_slot(name, `${name}0`)
      }
      this.each_io_name(name, n, (nom, i) => {
        this.put_input_slot(nom, type)
      })
      this.remove_inputs_after(n, name)
      node.size = node.computeSize()
    }
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