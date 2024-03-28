
export const DandyTypes = {
  JS: 'JS_URLS',
  HTML: 'HTML_URLS',
  CSS: 'CSS_URLS',
  JSON: 'JSON_URLS',
  YAML: 'YAML_URLS',
  CAPTURES: 'DANDY_CAPTURE',
}

export const DandyNames = {
  JS: 'js',
  HTML: 'html',
  CSS: 'css',
  JSON: 'json',
  YAML: 'yaml',
  CAPTURES: 'captures'
}

export const Mimes = {
  JS: 'application/javascript',
  HTML: 'text/html',
  CSS: 'text/css',
  JSON: 'application/json',
  YAML: 'application/yaml',
}

let i_dandy_widget = 0
export class DandyWidget {
  constructor(node, inputName, inputData, app) {
    this.type = inputData[0]
    this.name = inputName
    if (++i_dandy_widget === Number.MAX_SAFE_INTEGER) {
      i_dandy_widget = 0
    }
    this.id = `${inputName}_${i_dandy_widget}`
    this.callback = (value) => {
      console.log(`${this.id} callback`, value)
    }
    this.options = { serialize: true }
    this.value_ = null
    this.size = [0, 0]
    node.addCustomWidget(this)
  }

  get value() {
    return this.value_
  }

  set value(v) {
    this.value_ = v
    this.callback(v)
  }

  async serializeValue() {
    return this.value_
  }

  computeSize(width) {
    return this.size
  }
}