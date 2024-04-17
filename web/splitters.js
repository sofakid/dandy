import { DandyImageUrlChain, DandyIntChain, DandyBooleanChain, DandyFloatChain, DandyStringChain } from "/extensions/dandy/chains.js"
import { DandyNames, DandyTypes, DandyNode, DandyHashDealer, ComfyTypesList, DandyWidget, ComfyTypes } from "/extensions/dandy/dandymisc.js"

const max_outputs = 100

export class DandySplitter extends DandyNode {
  constructor(node, app, name, type) {
    super(node, app)
    this.debug_verbose = true
    this.name = name
    this.type = type
    this.hash_dealer = new DandyHashDealer(this)
    this.collection = []
    
    const n_outputs_widget = this.n_outputs_widget = this.find_widget('n_outputs')
    n_outputs_widget.callback = (x) => {
      const { chain } = this
      if (x >= 0) {
        const connections = this.get_output_connections()
        chain.n_outputs = x

        // if we don't do this timeout, if the taret nodes are moved, and the page is refreshed, they don't reconnect right
        const just_a_moment = 100
        setTimeout(() => {
          chain.reconnect_output_connections(connections)
          node.size = node.computeSize()
        }, just_a_moment)
      }
    }
  }

  get chain() {
    const { chains, type } = this
    return chains[type][0]
  }

  update_hash() {
    this.hash_dealer.message = this.chain.data
  }

  on_configure() {
    const { n_outputs_widget } = this
    n_outputs_widget.callback(n_outputs_widget.value)
    this.update_hash()
  }

  
  get_output_connections() {
    const { node, type } = this
    const { graph, outputs } = node

    const links_table = []

    if (outputs.length > 0) {
      outputs.forEach((output, i) => {
        const links_row = [] 
        if (output.type !== type) {
          links_table.push(links_row)
          return
        }

        const { links } = output
        if (links === null || links.length === 0) {
          links_table.push(links_row)
          return
        }
        
        for (let i = 0; i < links.length; ++i) {
          const link_id = links[i]
          const link = graph.links[link_id]
          if (link === undefined) {
            this.debug_log(`undefined link`)
            continue
          }

          // link can change, clone it
          const o = {...link}
          links_row.push(o)
        }
        links_table.push(links_row)
      })
    }
    this.debug_log('get_output_connections :: links_table: ', links_table)
    return links_table
  }

  on_connections_change(i_or_o, index, connected, link_info, input) {
    const { chain, type, node } = this 
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
    //this.debug_log('on_chain_updated')
    this.update_hash()
  }

  on_executed(output) {
    const { chain } = this 
    let value = output.value[0]
    value = value.value
    this.debug_log(`ON_EXECUTED :: value: <${value}>, output: `, output)

    if (this.last_value !== value) {
      this.last_value = value
      chain.output_update_ignoring_input(value)
    }
  }
}

export class DandyIntSplitter extends DandySplitter {
  constructor(node, app) {
    super(node, app, 'int', 'INT')
    new DandyIntChain(this, 1, 2)
  }
}

export class DandyFloatSplitter extends DandySplitter {
  constructor(node, app) {
    super(node, app, 'float', 'FLOAT')
    new DandyFloatChain(this, 1, 2)
  }
}

export class DandyBooleanSplitter extends DandySplitter {
  constructor(node, app) {
    super(node, app, 'boolean', 'BOOLEAN')
    new DandyBooleanChain(this, 1, 2)
  }
}

export class DandyStringArraySplitter extends DandySplitter {
  constructor(node, app) {
    super(node, app, 'string', 'STRING')
    new DandyStringChain(this, 1, 2)
  }
}
