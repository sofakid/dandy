

export class DandyChainData {
  static from_json(s) {
    const o = JSON.parse(s)
    if (o === undefined) {
      return o
    }
    return new DandyChainData(o.value. o.mime, o.type)
  }

  static wrap_if_needed(o, mime, type) {
    const x = o.is_dandy_chain_data ? o : new DandyChainData(o, mime, type)
    return x
  }

  constructor(value, mime, type) {
    this.value = value
    this.mime = mime
    this.type = type
    this.is_dandy_chain_data = true
  }

  get json() {
    const { value, mime, type, is_dandy_chain_data } = this
    return JSON.stringify({ value, mime, type, is_dandy_chain_data })
  }
}