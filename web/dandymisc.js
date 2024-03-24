

let i_dandy_widget = 0
export class DandyWidget {
  constructor(node, inputName, inputData, app) {
    console.log('new DandyWidget', inputName, inputData[0])
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