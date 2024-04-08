import { IO, DandyImageUrlChain, DandyIntChain, DandyBooleanChain, 
  DandyFloatChain, DandyStringChain } from "/extensions/dandy/chains.js"
import { DandyNames, DandyTypes, DandyNode } from "/extensions/dandy/dandymisc.js"

export class DandyCollector extends DandyNode {
  constructor(node, app, name, type) {
    super(node, app)
    this.name = name
    this.type = type
    
    this.dirty_widget = this.find_widget(DandyNames.DIRTY)
    this.collection_widget = this.find_widget(DandyNames.IMAGE_URL)
    
    this.dirty_widget.value = true
    this.collection_widget.value = []
  }

  get chain() {
    const { chains, type } = this
    return chains[type]
  }

  on_configure() {
    this.dirty_widget.value = true
  }

  on_executed(output) {
    console.log(`${this.constructor.name}.on_executed :: output: `, output)
    const { name } = this 
    const { collection_widget } = output 
    const value = output[name]

    const { chain } = this
    const last_value = collection_widget.value

    if (last_value !== value) {
      collection_widget.value = value
      chain.contributions = value
      chain.update_chain()
    }
  }
}

export class DandyImageCollector extends DandyNode {
  constructor(node, app) {
    super(node, app, DandyNames.IMAGE_URL, DandyTypes.IMAGE_URL)
    new DandyImageUrlChain(this, IO.IN_OUT)
  }
}

export class DandyIntCollector extends DandyNode {
  constructor(node, app) {
    super(node, app, 'int', 'INT')
    new DandyIntChain(this, IO.DOUBLE_IN_OUT)
  }
}

export class DandyFloatCollector extends DandyNode {
  constructor(node, app) {
    super(node, app, 'int', 'INT')
    new DandyFloatChain(this, IO.DOUBLE_IN_OUT)
  }
}

export class DandyBooleanCollector extends DandyNode {
  constructor(node, app) {
    super(node, app, 'int', 'INT')
    new DandyBooleanChain(this, IO.DOUBLE_IN_OUT)
  }
}

export class DandyStringCollector extends DandyNode {
  constructor(node, app) {
    super(node, app, 'int', 'INT')
    new DandyStringChain(this, IO.DOUBLE_IN_OUT)
  }
}