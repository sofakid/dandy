import { app } from "../../scripts/app.js"
import { api } from "../../scripts/api.js"
import { ComfyWidgets } from "../../scripts/widgets.js"
//import { ace } from "./ace/ace.js"

const extension_name = "dandy"
const extension_webroot = "/extensions/dandy/"
const extension_css = `${extension_webroot}dandy.css`
const JS_TYPE = 'JS_URLS'
const JS_NAME = 'js'

const loadDandyCss = (doc) => {
  const dandycss = doc.createElement("link")
  dandycss.rel = 'stylesheet'
  dandycss.type = 'text/css'
  dandycss.href = `${extension_css}`
  doc.head.appendChild(dandycss)
}

const connectJsIo = (dandy) => {
  const { node } = dandy
  node.addInput(JS_NAME, JS_TYPE)
  node.addOutput(JS_NAME, JS_TYPE)
  dandy.in_slot_javascript = node.findInputSlot(JS_NAME)
  dandy.out_slot_javascript = node.findOutputSlot(JS_NAME)
}

const dandyCssLink = `<link rel="stylesheet" type="text/css" href="${extension_css}" />`

let DANDY_INITIALIZED = false
const initDandy = () => {
  console.log("initDandy()")
  
  loadDandyCss(document)

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
    const response = await fetch(`${extension_webroot}ace/${js_}`)
    const text = await response.text()
    const blob = new Blob([text], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    ace.config.setModuleUrl(`ace/${feature}`, url)
    console.log(`${i_feature}/${n_features}:ace.config.setModuleUrl("ace/${feature}", ${url})`)
    if (++i_feature == n_features)
      console.log("DANDY_INITIALIZED")
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
  console.log("node.addDOMWidget(", el.id, type, el, simple_widget_getter_setter(el), ")")
  return node.addDOMWidget(el.id, type, el, simple_widget_getter_setter(el))
}

class DandyEditor {
  static i_editor = 0

  constructor(node) {
    this.node = node
    connectJsIo(this)

    console.log("initDandyEditorNode(node)", node)
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
      console.log('Event type:', event.type)
      console.log('Event details:', event)
      editor.resize()
    })
  }
}

class DandyCanvas {
  constructor(node) {
    this.node = node
    connectJsIo(this)

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
      const response = await fetch(`${extension_webroot}${js_}`)
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

class DandyJsLoader {
  constructor(node) {
    this.node = node
    connectJsIo(this)

    this.files = []
    this.urlmap = {}
    this.js_blobs = []
    this.serialize_widgets = true
    this.isVirtualNode = true
      
    const file_input = document.createElement("input")
    const js_files_selected = async () => {
      if (file_input.files.length) {
        console.log("this.add_js_files(file_input.files)", file_input, file_input.files)
        await this.add_js_files(file_input.files)
      }
    }

    Object.assign(file_input, {
      type: "file",
      accept: "application/javascript",
      style: "display: none",
      onchange: js_files_selected,
    })
    document.body.appendChild(file_input)

    const load_js_widget = node.addWidget("button", "JAVASCRIPT", "javascript", () => {
      file_input.click()
    })
    load_js_widget.label = "Choose files..."
    load_js_widget.serialize = false
    console.log('added widget', load_js_widget)

    const files_div = document.createElement("div")
    files_div.classList.add("dandyMax")
    
    const files_widget = add_simple_node(node, "div", files_div)
    files_widget.serialize = false

    const ul = document.createElement('ul')
    ul.classList.add('dandyUL')
    files_div.appendChild(ul)

    this.files.forEach((file, i) => {
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

      file_span.innerText = file
      move_up_button.innerHTML = "(up)"
      move_down_button.innerHTML = "(down)"
      remove_button.innerHTML = "(remove)"

      li.append(file_span, move_up_button, move_down_button, remove_button)
      ul.append(li)
    })
    
  }

  async add_js_files(chosen_files) {
    const { files, urlmap, js_blobs } = this
    for (let i = 0; i < chosen_files.length; ++i) {
      console.log("files", files)
      files.push(chosen_files[i])
    }

    for (let i = 0; i < files.length; ++i) {
      const file = files[i]
      console.log("FILE", file)
      if (urlmap[file] === undefined) {
        const response = await fetch(`${file}`)
        const text = await response.text()
        const blob = new Blob([text], { type: 'application/javascript' })
        const url = URL.createObjectURL(blob)
        js_blobs.push(blob)
        urlmap[file] = url
      }
    }
  }
}

const find_last_js_in_chain = (dandy, f_taking_dandy, seen = []) => {
  const { node, out_slot_javascript } = dandy
  const { graph, outputs } = node
  const output = outputs[out_slot_javascript]
  const { links } = output
  
  if (links === null || links.length === 0) {
    f_taking_dandy(dandy)
    return
  }

  links.forEach( (link_id) => {
    const link = graph.links[link_id]
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

    // console.log("TARGET_ID", link.target_id)
    const target_node = graph.getNodeById(link.target_id)
    const target_dandy = target_node.dandy
    find_last_js_in_chain(target_dandy, f_taking_dandy, seen_prime)
  })
}

class DandyP5JsLoader {
  
  constructor(node) {
    this.node = node
    connectJsIo(this)

    node.size = [180, 55]

    this.js_blob = null
    this.js_url = ""
    this.serialize_widgets = true
    this.isVirtualNode = true
    this.loaded = false

    this.update_js = this.update_js.bind(this)

    console.log("onConnectionsChange", node.onConnectionsChange)
    node.onConnectionsChange = (type, index, connected, link_info) => {
      find_last_js_in_chain(this, (dandy) => {
        console.log("Found last dandy node", dandy)
        dandy.update_js()
      })
    }

    this.load_p5js()
  }

  async load_p5js() {
    const response = await fetch(`${extension_webroot}p5/p5.js_`)
    const text = await response.text()
    this.js_blob = new Blob([text], { type: 'application/javascript' })
    this.js_url = URL.createObjectURL(this.js_blob)
    console.log("Loaded P5js", this.js_url)
    this.loaded = true

    this.update_js()
    find_last_js_in_chain(this, (dandy) => {
      console.log("Found last dandy node", dandy)
      dandy.update_js()
    })
  }
  
  update_js() {
    console.log('DandyP5JsLoader.update_js()')
    const { in_slot_javascript, out_slot_javascript, node, js_url } = this
    
    const force_update = true
    let out_urls = ""
    if (node.isInputConnected(in_slot_javascript)) {
      const in_urls = node.getInputData(in_slot_javascript, force_update)
      console.log("input urls", in_urls, "but is connected", node.isInputConnected(in_slot_javascript))
      out_urls += `${in_urls}\n`
    }

    out_urls += js_url
    console.log('DandyP5JsLoader.update_js() :: out_urls', out_urls)
    node.setOutputData(out_slot_javascript, out_urls)
    node.triggerSlot(out_slot_javascript)
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
        node.dandy = new klass(node)
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

