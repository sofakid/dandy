import { DandyJsChain } from "/extensions/dandy/js_chain.js"

const dandy_webroot = "/extensions/dandy/"

let i_files_pre = 0
let i_texty_widget = 0

// ==========================================================================================
export class DandyJsLoader {
  constructor(node, app) {
    this.node = node
    this.app = app
    this.js_chain = new DandyJsChain(this, node, app)

    this.files_order = []
    this.filemap = {}
    this.urlmap = {}
    this.blobmap = {}

    node.serialize_widgets = true
      
    const file_input = document.createElement("input")
    const js_files_selected = async () => {
      if (file_input.files.length) {
        await this.add_js_files(file_input.files)
      }
    }

    Object.assign(file_input, {
      type: "file",
      multiple: true,
      accept: "application/javascript",
      style: "display: none",
      onchange: js_files_selected,
    })
    document.body.appendChild(file_input)

    this.file_input = file_input

    const load_js_widget = node.addWidget("button", "JAVASCRIPT", "javascript", () => {
      file_input.click()
    })
    load_js_widget.label = "Choose files..."
    load_js_widget.serialize = false

    const files_pre = document.createElement("pre")

    files_pre.classList.add("dandyMax")
    files_pre.id = `files_pre_${i_files_pre++}`
    const files_widget = node.addDOMWidget(files_pre.id, "pre", files_pre)
    files_widget.serialize = false

    const ul = document.createElement('ul')
    ul.classList.add('dandyUL')
    files_pre.appendChild(ul)
    this.ul_filelist = ul
  }

  reset_file_input() {
    this.file_input.value = null; // Reset the value to clear selected files
  }

  move_up(filename) {
    const { files_order } = this
    const i = files_order.indexOf(filename)
    const j = i - 1
    const exists_and_not_at_front = i > 0
    
    if (exists_and_not_at_front) {
      const x = files_order[j]
      files_order[j] = files_order[i]
      files_order[i] = x
    }

    this.render_file_list()
    this.update_chain()
  }

  move_down(filename) {
    const { files_order } = this
    const i = files_order.indexOf(filename)
    const j = i + 1
    const found = i >= 0
    const not_at_end = i < files_order.length - 1
    
    if (found && not_at_end) {
      const x = files_order[j]
      files_order[j] = files_order[i]
      files_order[i] = x
    }

    this.render_file_list()
    this.update_chain()
  }
  
  remove_file(filename) {
    const { blobmap, urlmap, filemap } = this
  
    this.files_order = this.files_order.filter( (x) => x !== filename )
    URL.revokeObjectURL(urlmap[filename])
    urlmap[filename] = undefined
    filemap[filename] = undefined
    blobmap[filename] = undefined

    this.reset_file_input()
    this.render_file_list()
    this.update_chain()
  }

  render_file_list() {
    const { files_order, ul_filelist } = this

    ul_filelist.innerHTML = ''
    const n_files = files_order.length
    if (n_files === 0) {
      return
    }

    files_order.forEach((filename, i) => {
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
    const { files_order, urlmap, js_chain } = this
    let s = ''
    files_order.forEach((filename) => {
      const url = urlmap[filename]
      s += `${url}\n`
    })
    js_chain.js_urls = s
    js_chain.update_chain()
  }

  async add_js_files(chosen_files) {
    const { files_order, filemap, urlmap, blobmap } = this

    let i_file = 0
    const n_files = chosen_files.length
    
    // foreach doesn't work :()
    for (let i = 0; i < n_files; ++i) {
      const file = chosen_files[i]
      const { name, size, lastModified } = file

      if (files_order.indexOf(name) === -1) {
        files_order.push(name)
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const scriptText = event.target.result
        const blob = new Blob([scriptText], { type: 'application/javascript' })
        const url = URL.createObjectURL(blob)

        const existing = urlmap[name]
        if (existing) {
          URL.revokeObjectURL(existing)
        }

        filemap[name] = file
        blobmap[name] = blob
        urlmap[name] = url

        if (++i_file === n_files) {
          this.update_chain()
          this.render_file_list()
        }
      }
  
      reader.readAsText(file)
    }
  }
}

// ==========================================================================================
export class DandyP5JsLoader {
  constructor(node, app) {
    this.node = node
    this.app = app
    this.js_chain = new DandyJsChain(this, node, app)

    if (DandyJsChain.debug_blobs) {
      node.size = [380, 100]
    } else {
      node.size = [290, 75]
    }

    this.js_blob = null
    this.js_url = ""
    this.serialize_widgets = true
    this.isVirtualNode = true

    const texty = document.createElement("pre")
    texty.id = `texty_${i_texty_widget++}`
    texty.classList.add("dandyMax")
    this.texty = texty

    const texty_widget = node.addDOMWidget(texty.id, "pre", texty)
    texty_widget.serialize = false

    this.load_p5js()
  }

  async load_p5js() {
    const response = await fetch(`${dandy_webroot}p5/p5.js_`)
    const text = await response.text()
    this.js_blob = new Blob([text], { type: 'application/javascript' })
    this.js_url = URL.createObjectURL(this.js_blob)

    this.js_chain.js_urls = this.js_url
    this.js_chain.update_chain()

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
        console.error("Error reading top line of p5.js:", error)
    })
  }
}
