import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js"
import { ComfyWidgets } from "../../scripts/widgets.js";
//import { ace } from "./ace/ace.js";

const extension_name = "dandy"
const extension_webroot = "/extensions/dandy/"
const extension_css = `${extension_webroot}dandy.css`

const loadDandyCss = (doc) => {
  const dandycss = doc.createElement("link")
  dandycss.rel = 'stylesheet'
  dandycss.type = 'text/css'
  dandycss.href = `${extension_css}`
  doc.head.appendChild(dandycss)
}

const dandyCssLink = `<link rel="stylesheet" type="text/css" href="${extension_css}" />`

let DANDY_INITIALIZED = false
const initDandy = () => {
  console.log("initDandy()")
  
  loadDandyCss(document)

  const pairwise = (a) => {
    const x = [];
    for (let i = 0; i < a.length; i += 2)
      x.push([a[i], a[i + 1]]);
    return x;
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
    const [feature, js_] = pair;
    const response = await fetch(`${extension_webroot}ace/${js_}`);
    const text = await response.text();
    const blob = new Blob([text], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    ace.config.setModuleUrl(`ace/${feature}`, url);
    console.log(`${i_feature}/${n_features}:ace.config.setModuleUrl("ace/${feature}", ${url});`)
    if (++i_feature == n_features)
      console.log("DANDY_INITIALIZED")
      DANDY_INITIALIZED = true
  });
}


const simple_widget_getter_setter = (el) => {
  return {
		getValue()  { return el.value },
		setValue(v) { el.value = v },
	}
}

const add_simple_node = (node, el) => {
  console.log("node.addDOMWidget(", el.id, el.id, el, simple_widget_getter_setter(el), ")")
  return node.addDOMWidget(el.id, el.id, el, simple_widget_getter_setter(el));
}

const initDandyEditorNode = (node) => {
  console.log("initDandyEditorNode(node)", node)
  const editor_id = `dandy_editor_${node.id}`

  const dandy_div = document.createElement("div")
  dandy_div.classList.add("dandy-node")
  
  const widget = add_simple_node(node, dandy_div)
  
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

let iDandies = 0
const getNextId = () => {
  return iDandies++
}

const initDandyCanvasNode = async (node) => {
  const dandyland = document.createElement("iframe")
  dandyland.classList.add('dandyMax')
  dandyland.id = `dandyland_${getNextId()}`

  const js_files = ["p5/p5.js_"]
  const n_files = js_files.length
  const js_blob_urls = []

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
  const widget = add_simple_node(node, dandyland)
  widget.dandyland = dandyland
  widget.js_blob_urls = js_blob_urls
}

// -----------------------------------------------------------------------------------
const ext = {
	// Unique name for the extension
	name: extension_name,
	async init(app) {
		// Any initial setup to run as soon as the page loads
		initDandy()
	},
	async setup(app) {
		// Any setup to run after the app is created
	},
	async addCustomNodeDefs(defs, app) {
		// Add custom node definitions
		// These definitions will be configured and registered automatically
		// defs is a lookup core nodes, add yours into this
	},
	async getCustomWidgets(app) {
		// Return custom widget types
		// See ComfyWidgets for widget examples
    return {
      JAVASCRIPT(node, inputName, inputData, app) {
        console.log("GET CUSTOME WIGET CANVAS", CANVAS)
        return addCanvasWidget(node,inputName,inputData, app)
      } 
    }
	},
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		// Run custom logic before a node definition is registered with the graph

		// This fires for every node definition so maybe only once
		//delete ext.beforeRegisterNodeDef;
	},
	async registerCustomNodes(app) {
		// Register any custom node implementations here allowing for more flexability than a custom node def
    class DandyLand {

    }
  },
	loadedGraphNode(node, app) {
		// Fires for each node when loading/dragging/etc a workflow json or png
		// If you break something in the backend and want to patch workflows in the frontend
		// This is the place to do this

		// This fires for every node on each load so maybe only once
		//delete ext.loadedGraphNode;
	},
	nodeCreated(node, app) {
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

    when_up(() => {
      const title = node.getTitle();
      // node.type not set at this point? 
      switch (title) {
        case "Dandy Editor":
          initDandyEditorNode(node);
          break;
        case "Dandy Canvas":
          initDandyCanvasNode(node);
          break;
        case "Dandy JavaScript Loader":
          initDandyJavaScriptLoaderNode(node);
          break;
      }

    })
	}
};

app.registerExtension(ext);

