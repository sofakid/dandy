import { DandyHtmlChain, DandyJsChain, DandyCssChain, DandyJsonChain, DandyWasmChain, DandyYamlChain, 
  DandyImageUrlChain, DandyIntChain, DandyFloatChain, DandyBooleanChain, DandyStringChain } from '/extensions/dandy/chains.js'
import { DandyTown } from '/extensions/dandy/dandytown.js'
import { dandy_load_list_of_urls } from '/extensions/dandy/dandymisc.js'

export class DandyLand extends DandyTown {
  constructor(node, app) {
    super(node, app)

    this.html_chain = new DandyHtmlChain(this, 1, 0)
    this.css_chain = new DandyCssChain(this, 1, 0)
    this.js_chain = new DandyJsChain(this, 1, 0)
    this.wasm_chain = new DandyWasmChain(this, 1, 0)
    this.json_chain = new DandyJsonChain(this, 1, 0)
    this.yaml_chain = new DandyYamlChain(this, 1, 0)
    this.image_url_chain = new DandyImageUrlChain(this, 1, 0)
    this.int_chain = new DandyIntChain(this, 1, 0)
    this.float_chain = new DandyFloatChain(this, 1, 0)
    this.boolean_chain = new DandyBooleanChain(this, 1, 0)
    this.string_chain = new DandyStringChain(this, 1, 0)
    
    this.output_int_chain = new DandyIntChain(this, 0, 1)
    this.output_float_chain = new DandyFloatChain(this, 0, 1)
    this.output_boolean_chain = new DandyBooleanChain(this, 0, 1)
    this.output_string_chain = new DandyStringChain(this, 0, 1)
  }

  get show_freeze_button() {
    return true
  }

  get html_urls() {
    return this.html_chain.values
  }

  get css_urls() {
    return this.css_chain.values
  }
  
  get json_urls() {
    return this.json_chain.values
  }

  get yaml_urls() {
    return this.yaml_chain.values
  }

  get image_urls() {
    return this.image_url_chain.values
  }

  get js_data() {
    return this.js_chain.data
  }

  output_int(int) {
    this.output_int_chain.contributions = int
  }

  output_float(float) {
    this.output_float_chain.contributions = float
  }

  output_boolean(boolean) {
    this.output_boolean_chain.contributions = boolean
  }

  output_string(string) {
    this.output_string_chain.contributions = string
  }

}