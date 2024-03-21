import { app } from "../../scripts/app.js"
import { ComfyWidgets } from "../../scripts/widgets.js"

const extension_name = "dandy"
const dandy_webroot = "/extensions/dandy/"
const dandy_css = `${dandy_webroot}dandy.css`

const JS_TYPE = 'JS_URLS'
const JS_NAME = 'js'

const load_css = (doc, url) => {
  const link = doc.createElement("link")
  link.rel = 'stylesheet'
  link.type = 'text/css'
  link.href = url
  doc.head.appendChild(link)
}

const load_dandy_css = (doc) => {
  load_css(doc, dandy_css)
}

const dandyCssLink = `<link rel="stylesheet" type="text/css" href="${dandy_css}" />`

let DANDY_INITIALIZED = false
const initDandy = () => {
  load_dandy_css(document)

  const pairwise = (a) => {
    const x = []
    for (let i = 0; i < a.length; i += 2)
      x.push([a[i], a[i + 1]])
    return x
  }
  
  // comfyui will try to load these if we leave them as .js files.
  // but ace wants to load them its own way,
  // so we rename them to .js_ and map the features here
  const features_and_codes = [
    "theme/twilight", "theme-twilight.js_",
    "theme/cloud9_day", "theme-cloud9_day.js_",
    "theme/crimson_editor", "theme-crimson_editor.js_",
    "mode/javascript", "mode-javascript.js_",
    "mode/javascript_worker", "worker-javascript.js_",
  ]

  const n_features = features_and_codes.length / 2
  let i_feature = 0

  pairwise(features_and_codes).forEach(async pair => {
    const [feature, js_] = pair
    const response = await fetch(`${dandy_webroot}ace/${js_}`)
    const text = await response.text()
    const blob = new Blob([text], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    ace.config.setModuleUrl(`ace/${feature}`, url)
    //console.log(`${i_feature}/${n_features}:ace.config.setModuleUrl("ace/${feature}", ${url})`)
    if (++i_feature == n_features)
      //console.log("DANDY_INITIALIZED")
      DANDY_INITIALIZED = true
  })
}


const simple_widget_getter_setter = (el) => {
  return {
		getValue()  { return el.value },
		setValue(v) { el.value = v },
	}
}

const add_simple_node = (node, type, el) => {
  return node.addDOMWidget(el.id, type, el, simple_widget_getter_setter(el))
}

class DandyEditor {
  static i_editor = 0

  constructor(node, app) {
    this.node = node
    this.app = app
    this.js_chain = new DandyJsChain(this, node, app)

    const node_type = 'dandy_editor'
    const editor_id = `${node_type}_${DandyEditor.i_editor++}`

    const dandy_div = document.createElement("div")
    dandy_div.classList.add("dandy_node")
    
    const widget = add_simple_node(node, node_type, dandy_div)
    
    const editor_pre = document.createElement("pre")
    editor_pre.classList.add("dandy-editor")
    editor_pre.id = editor_id
    editor_pre.style.width = "100%"
    editor_pre.style.height = "100%"
    editor_pre.style.marginTop = "0px"
    editor_pre.style.marginBottom = "0px"
    
    dandy_div.appendChild(editor_pre)
    
    widget.dandy_div = dandy_div
    widget.editor_pre = editor_pre
    
    const editor = ace.edit(editor_id)
    editor.setTheme("ace/theme/twilight")
    editor.session.setMode("ace/mode/javascript")
    
    // comfyui uses css transforms 
    // without this line, cursor postion and mouse clicks won't line up
    editor.setOption('hasCssTransforms', true)

    editor_pre.addEventListener("resize", (event) => {
      editor.resize()
    })
  }
}

class DandyCanvas {
  constructor(node, app) {
    this.node = node
    this.app = app
    this.js_chain = new DandyJsChain(this, node, app)

    this.dandyland = null
    this.widget = null
    this.js_blob_urls = []
    //node.addInput("javascript", "JAVASCRIPT")
    this.load_dandyland()
  }

  async load_dandyland() {
    const { js_blob_urls, node } = this

    const dandyland = document.createElement("iframe")
    dandyland.classList.add('dandyMax')

    const js_files = ["p5/p5.js_"]
    const n_files = js_files.length

    for (let i_file = 0; i_file < n_files; i_file++) {
      const js_ = js_files[i_file]
      const response = await fetch(`${dandy_webroot}${js_}`)
      const text = await response.text()
      const blob = new Blob([text], { type: 'application/javascript' })
      const url = URL.createObjectURL(blob)
      js_blob_urls.push(url)
    }

    const script_tags = js_blob_urls.map((url) => `<script type="application/javascript" src=${url}></script>`)

    dandyland.srcdoc = `<html class="dandyMax"><head>${dandyCssLink}</head><body class="dandyMax">
      ${script_tags.join("\n    ")}
      <canvas class="dandyMax" />
    </body></html>`
    
    // Add the iframe to the DOM after all scripts are loaded
    const widget = add_simple_node(node, "dandyland", dandyland)
    this.dandyland = dandyland
    this.widget = widget
  }
}

// ==========================================================================================
class DandyJsLoader {
  constructor(node, app) {
    this.node = node
    this.app = app
    this.js_chain = new DandyJsChain(this, node, app)

    this.files_order = []
    this.filemap = {}
    this.urlmap = {}
    this.blobmap = {}

    this.serialize_widgets = true
    this.isVirtualNode = true
      
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

    const files_div = document.createElement("pre")
    files_div.classList.add("dandyMax")
    
    const files_widget = add_simple_node(node, "div", files_div)
    files_widget.serialize = false

    const ul = document.createElement('ul')
    ul.classList.add('dandyUL')
    files_div.appendChild(ul)
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
class DandyJsChain {
  static debug_blobs = false

  constructor(dandy, node, app) {
    this.dandy = dandy
    this.node = node
    this.app = app
    this.js_urls = ""

    node.addInput(JS_NAME, JS_TYPE)
    node.addOutput(JS_NAME, JS_TYPE)
    this.in_slot_javascript = node.findInputSlot(JS_NAME)
    this.out_slot_javascript = node.findOutputSlot(JS_NAME)

    if (DandyJsChain.debug_blobs) {
      this.urls_widget = ComfyWidgets.STRING(node, "urls", ["", {default:"", multiline: true}], app)
      this.urls_widget.serialize = false
    }

    node.onConnectionsChange = (type, index, connected, link_info) => {
      this.follow_js_chain((js_chain) => {
        js_chain.update_js()
      })
    }
  }

  // f_each_node: (js_chain) => {}
  follow_js_chain(f_each_node, seen = []) {
    const { node, out_slot_javascript } = this
    const { graph, outputs } = node
    const output = outputs[out_slot_javascript]
    const { links } = output
    
    f_each_node(this)

    if (links === null || links.length === 0) {
      // we've reached the end
      return
    }

    links.forEach( (link_id) => {
      const link = graph.links[link_id]
      if (link === undefined) {
        // node was likely removed and that's why we're firing
        return
      }

      const { target_id } = link
      
      let loopy = false
      seen.forEach( (seen_target_id) => {
        if (seen_target_id === target_id) {
          loopy = true
        }
      })
      if (loopy) {
        console.error("loop in graph, bailing")
        return
      }
      const seen_prime = seen.concat([target_id])

      const target_node = graph.getNodeById(link.target_id)
      const target_dandy = target_node.dandy
      const target_chain = target_dandy.js_chain
      target_chain.follow_js_chain(f_each_node, seen_prime)
    })
  }

  update_chain() {
    this.follow_js_chain((js_chain) => {
      js_chain.update_js()
    })
  }

  update_js() {
    const { in_slot_javascript, out_slot_javascript, node, js_urls } = this

    let out_urls = ""
    if (node.isInputConnected(in_slot_javascript)) {
      const force_update = false
      const in_urls = node.getInputData(in_slot_javascript, force_update)
      out_urls += `${in_urls}\n`
    }

    out_urls += js_urls
    node.setOutputData(out_slot_javascript, out_urls)
    node.triggerSlot(out_slot_javascript)

    if (DandyJsChain.debug_blobs) {
      this.urls_widget.widget.element.value = out_urls
    }
  }
}

// ==========================================================================================
class DandyP5JsLoader {
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
    texty.classList.add("dandyMax")
    this.texty = texty

    const texty_widget = add_simple_node(node, "pre", texty)
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

// -----------------------------------------------------------------------------------
const ext = {
	// Unique name for the extension
	name: extension_name,
	init: async (app) => {
		// Any initial setup to run as soon as the page loads
		initDandy()
	},
	setup: async (app) => {
		// Any setup to run after the app is created
	},
	addCustomNodeDefs: async (defs, app) => {
		// Add custom node definitions
		// These definitions will be configured and registered automatically
		// defs is a lookup core nodes, add yours into this
	},
	getCustomWidgets: async (app) => {
		// Return custom widget types
		// See ComfyWidgets for widget examples
    return {
      // JAVASCRIPT(node, inputName, inputData, app) {
      //   console.log("get custom Javascript widget")
      //   return add_choose_js_files_widget(node, inputName, inputData, app)
      // } 
    }
	},
	beforeRegisterNodeDef: async (nodeType, nodeData, app) => {
		// Run custom logic before a node definition is registered with the graph

		// This fires for every node definition so maybe only once
		//delete ext.beforeRegisterNodeDef
	},
	registerCustomNodes: async (app) => {
		// Register any custom node implementations here allowing for more flexability than a custom node def
    // LiteGraph.registerNodeType("Dandy Js Loader", DandyJavascriptLoader)
    // this next category set has to be after registerNodeType, i can't explain why.
    // DandyJavascriptLoader.category = "DandyLand"
  },
	loadedGraphNode: (node, app) => {
		// Fires for each node when loading/dragging/etc a workflow json or png
		// If you break something in the backend and want to patch workflows in the frontend
		// This is the place to do this
		// This fires for every node on each load so maybe only once
		//delete ext.loadedGraphNode
	},
	nodeCreated: (node, app) => {
    // Fires every time a node is constructed
    // You can modify widgets/add handlers/etc here

    // we load stuff async in init, so we postpone till everythign is ready. 
    // when nodes are already in the workflow when it starts up they'll run this before we're ready
    function when_up(f) {
      if (DANDY_INITIALIZED === false) {
        window.requestAnimationFrame(() => when_up(f))
        return
      }
      f()
    }

    const initDandyNode = (klass) => {
      if (klass)
        node.dandy = new klass(node, app)
    }

    const o = {
      "Dandy Editor": DandyEditor,
      "Dandy Canvas": DandyCanvas,
      "Dandy Js Loader": DandyJsLoader,
      "Dandy p5.js Loader": DandyP5JsLoader,
    }

    when_up(() => {
      initDandyNode(o[node.getTitle()])
    })
	}
}

app.registerExtension(ext)

