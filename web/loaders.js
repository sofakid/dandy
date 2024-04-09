import { DandyChain, DandyJsChain, DandyHtmlChain, DandyCssChain, DandyJsonChain, 
         DandyYamlChain, DandyWasmChain, DandyImageUrlChain } from "/extensions/dandy/chains.js"
import { DandyNames, DandyNode, DandyTypes, Mimes, dandy_js_plain_module_toggle } from "/extensions/dandy/dandymisc.js"
import { ComfyWidgets } from "/scripts/widgets.js"

const dandy_webroot = "/extensions/dandy/"

let i_files_pre = 0
let i_texty_widget = 0

class DandyFileLoader extends DandyNode {
  constructor(node, app, mimetype, type) {
    super(node, app)
    this.mimetype = mimetype
    this.type = type
    this.filemap = {}
    this.urlmap = {}
    this.blobmap = {}
    this.chains = {}

    if (node.properties === undefined) {
      node.properties = {
        texts: {},
        order: []
      }
    }
    
    this.init_widgets_above_files()
    this.make_file_input()
  }

  make_file_input() {
    const { mimetype, node } = this
    const file_input = this.file_input = document.createElement("input")
    const on_files_selected = async () => {
      if (file_input.files.length) {
        await this.add_files(file_input.files)
      }
    }

    Object.assign(file_input, {
      type: "file",
      multiple: true,
      accept: mimetype,
      style: "display: none",
      onchange: on_files_selected,
    })
    document.body.appendChild(file_input)


    const load_file_widget = node.addWidget("button", "choose_file_button", "", () => {
      file_input.click()
      this.reset_file_input()
    })
    load_file_widget.label = "Choose files..."

    const files_pre = document.createElement("pre")
    files_pre.classList.add("dandyMax")
    files_pre.id = `files_pre_${i_files_pre++}`
    node.addDOMWidget(files_pre.id, "pre", files_pre, {})
    
    const ul = document.createElement('ul')
    ul.classList.add('dandyUL')
    files_pre.appendChild(ul)
    this.ul_filelist = ul
  }

  init_widgets_above_files() {
  }

  on_configure(info) {
    this.load_from_properties()
  }

  reset_file_input() {
    this.file_input.value = null
  }

  move_up(filename) {
    const { order } = this.node.properties
    const i = order.indexOf(filename)
    const j = i - 1
    const exists_and_not_at_front = i > 0
    
    if (exists_and_not_at_front) {
      const x = order[j]
      order[j] = order[i]
      order[i] = x
    }

    this.render_file_list()
    this.update_chain()
  }

  move_down(filename) {
    const { order } = this.node.properties
    const i = order.indexOf(filename)
    const j = i + 1
    const found = i >= 0
    const not_at_end = i < order.length - 1
    
    if (found && not_at_end) {
      const x = order[j]
      order[j] = order[i]
      order[i] = x
    }

    this.render_file_list()
    this.update_chain()
  }
  
  remove_file(filename) {
    const { properties } = this.node
    const { texts } = properties
    const { blobmap, urlmap, filemap } = this
  
    properties.order = properties.order.filter( (x) => x !== filename )
    URL.revokeObjectURL(urlmap[filename])
    urlmap[filename] = undefined
    filemap[filename] = undefined
    blobmap[filename] = undefined
    texts[filename] = undefined

    this.reset_file_input()
    this.render_file_list()
    this.update_chain()
  }

  remove_all() {
    const { properties } = this.node
    const { order } = properties
    const { urlmap } = this
  
    if (order.length > 0) {
      const filename = order[0]
      URL.revokeObjectURL(urlmap[filename])
      this.urlmap = {}
      this.filemap = {}
      this.blobmap = {}
      properties.texts = {}
      properties.order = []
    }
  }

  render_file_list() {
    const { order } = this.node.properties
    const { ul_filelist } = this

    ul_filelist.innerHTML = ''
    const n_files = order.length
    if (n_files === 0) {
      return
    }

    order.forEach((filename, i) => {
      const li = document.createElement('li')
      const file_span = document.createElement('span')
      const move_up_button = document.createElement('span')
      const move_down_button = document.createElement('span')
      const remove_button = document.createElement('span')
      
      li.classList.add('dandyLI')
      file_span.classList.add('dandyFileSpan')
      move_up_button.classList.add('dandySpanButton')
      move_down_button.classList.add('dandySpanButton')
      remove_button.classList.add('dandySpanButton')

      file_span.innerText = filename

      move_up_button.innerHTML = '↑'
      move_down_button.innerHTML = '↓'
      remove_button.innerHTML = '✖'

      const first = i === 0
      const last = i === n_files - 1
      move_up_button.style.display = first ? "none" : "inline"
      move_down_button.style.display = last ? "none" : "inline"

      move_up_button.onclick   = () => {this.move_up(filename)}
      move_down_button.onclick = () => {this.move_down(filename)}
      remove_button.onclick    = () => {this.remove_file(filename)}

      li.append(file_span, move_up_button, move_down_button, remove_button)
      ul_filelist.append(li)
    })
    
  }

  update_chain() {
    const { order } = this.node.properties
    const { urlmap, chains, type } = this
    const chain = chains[type]
    let s = ''
    order.forEach((filename) => {
      const url = urlmap[filename]
      s += `${url}\n`
    })
    chain.contributions = s
  }

  async add_files(chosen_files) {
    const { order } = this.node.properties

    let i_file = 0
    const n_files = chosen_files.length
    
    for (let i = 0; i < n_files; ++i) {
      const file = chosen_files[i]
      const { name, size, lastModified } = file
      
      if (order.indexOf(name) === -1) {
        order.push(name)
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target.result
        this.load_maps(name, text)
        if (++i_file === n_files) {
          this.update_chain()
          this.render_file_list()
        }
      }
  
      reader.readAsText(file)
    }
  }

  load_from_properties() {
    const { texts } = this.node.properties
    Object.entries(texts).forEach(([filename, text]) => {
      this.load_maps(filename, text)
    })
    this.update_chain()
    this.render_file_list()
  }

  load_maps(filename, text) {
    const { mimetype, node } = this
    const { texts } = node.properties
    const { urlmap, blobmap } = this

    const blob = new Blob([text], { type: mimetype })
    const url = URL.createObjectURL(blob)
    
    const existing = urlmap[filename]
    if (existing) {
      URL.revokeObjectURL(existing)
    }
    
    texts[filename] = text
    blobmap[filename] = blob
    urlmap[filename] = url
  }
}


class DandySingleFileLoader extends DandyFileLoader {
  constructor(node, app, mimetype, type) {
    super(node, app, mimetype, type)
  }

  make_file_input() {    
    const { mimetype, node } = this

    const file_input = this.file_input = document.createElement("input")
    const on_files_selected = async () => {
      if (file_input.files.length) {
        this.remove_all()
        await this.add_files(file_input.files)
      }
    }

    Object.assign(file_input, {
      type: "file",
      multiple: false,
      accept: mimetype,
      style: "display: none",
      onchange: on_files_selected,
    })
    document.body.appendChild(file_input)

    const load_file_widget = node.addWidget("button", "choose_file_button", "", () => {
      file_input.click()
      this.reset_file_input()
    })
    load_file_widget.label = "Choose file..."

    const files_pre = document.createElement("pre")
    files_pre.classList.add("dandyMax")
    files_pre.id = `files_pre_${i_files_pre++}`
    node.addDOMWidget(files_pre.id, "pre", files_pre, {})
    
    const ul = document.createElement('ul')
    ul.classList.add('dandyUL')
    files_pre.appendChild(ul)
    this.ul_filelist = ul

  }

  render_file_list() {
    const { order } = this.node.properties
    const { ul_filelist } = this

    ul_filelist.innerHTML = ''
    const n_files = order.length
    if (n_files === 0) {
      return
    }

    order.forEach((filename, i) => {
      const li = document.createElement('li')
      const file_span = document.createElement('span')
      const remove_button = document.createElement('span')
      
      li.classList.add('dandyLI')
      file_span.classList.add('dandyFileSpan')
      remove_button.classList.add('dandySpanButton')

      file_span.innerText = filename

      remove_button.innerHTML = '✖'
      remove_button.onclick = () => {this.remove_file(filename)}

      li.append(file_span, remove_button)
      ul_filelist.append(li)
    }) 
  }
}


export class DandyJsLoader extends DandyFileLoader {
  constructor(node, app) {
    super(node, app, Mimes.JS, DandyTypes.JS)
    new DandyJsChain(this, 1, 1)
  }

  init_widgets_above_files() {
    dandy_js_plain_module_toggle(this)
  }
}

export class DandyHtmlLoader extends DandySingleFileLoader {
  constructor(node, app) {
    super(node, app, Mimes.HTML, DandyTypes.HTML)
    new DandyHtmlChain(this, 0, 1)
  }
}

export class DandyWasmLoader extends DandySingleFileLoader {
  constructor(node, app) {
    super(node, app, Mimes.WASM, DandyTypes.WASM)
    new DandyWasmChain(this, 0, 1)
  }
}

export class DandyCssLoader extends DandyFileLoader {
  constructor(node, app) {
    super(node, app, Mimes.CSS, DandyTypes.CSS)
    new DandyCssChain(this, 1, 1)
  }
}

export class DandyJsonLoader extends DandyFileLoader {
  constructor(node, app) {
    super(node, app, Mimes.JSON, DandyTypes.JSON)
    new DandyJsonChain(this, 1, 1)
  }
}

export class DandyYamlLoader extends DandyFileLoader {
  constructor(node, app) {
    super(node, app, Mimes.YAML, DandyTypes.YAML)
    new DandyYamlChain(this, 1, 1)
  }
}

// ==========================================================================================
export class DandyP5JsLoader extends DandyNode {
  constructor(node, app) {
    super(node, app)
    this.chain = new DandyJsChain(this, 1, 1)
    this.type = DandyTypes.JS

    if (DandyChain.debug_blobs) {
      node.size = [380, 100]
    } else {
      node.size = [290, 75]
    }

    this.js_blob = null
    this.js_url = ""
    this.serialize_widgets = false

    const texty = document.createElement("pre")
    texty.id = `texty_${i_texty_widget++}`
    texty.classList.add("dandyMax")
    this.texty = texty

    const texty_widget = node.addDOMWidget(texty.id, "pre", texty)

    this.load_p5js()
  }

  async load_p5js() {
    const response = await fetch(`${dandy_webroot}p5/p5.js_`)
    const text = await response.text()
    this.js_blob = new Blob([text], { type: Mimes.JS })
    this.js_url = URL.createObjectURL(this.js_blob)

    this.chain.contributions = this.js_url
    this.chain.update_chain()

    const p = new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = function(event) {
        const content = event.target.result
        const lines = content.split('\n')
        const topLine = lines[0]
        resolve(topLine)
      }

      reader.onerror = (event) => {
        reject(event.target.error)
      }

      reader.readAsText(this.js_blob.slice(0, 1024)) // only the first 1KB
    })

    p.then(topLine => {
      this.texty.innerText = topLine
    })
    .catch(error => {
      this.error_log("Error reading top line of p5.js:", error)
    })
  }
}

export class DandyUrlLoader extends DandyNode {
  constructor(node, app) {
    super(node, app)
    this.html_chain = new DandyHtmlChain(this, 0, 1)
    this.css_chain = new DandyCssChain(this, 1, 1)
    this.js_chain = new DandyJsChain(this, 1, 1)
    this.wasm_chain = new DandyWasmChain(this, 1, 1)
    this.json_chain = new DandyJsonChain(this, 1, 1)
    this.yaml_chain = new DandyYamlChain(this, 1, 1)
    this.image_url_chain = new DandyImageUrlChain(this, 1, 1)

    dandy_js_plain_module_toggle(this)

    const cw = ComfyWidgets.STRING(node, '', 
      ['', { default:'', multiline: true, serialize: true }], app)
  
    cw.widget.callback = (text) => {
      this.for_each_chain((chain, type) => {
        chain.contributions = text
      })
    }
  }
}