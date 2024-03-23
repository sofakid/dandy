import { app } from "../../scripts/app.js"
import { load_dandy_css } from "/extensions/dandy/dandycss.js"
import { DandyEditor, DandyP5JsDraw, DandyP5JsSetup } from "/extensions/dandy/editors.js"
import { new_dandy_capture_widget, DandyLand } from "/extensions/dandy/dandyland.js"
import { DandyJsLoader, DandyP5JsLoader } from "/extensions/dandy/js_loaders.js"

const extension_name = "dandy"
const dandy_webroot = "/extensions/dandy/"

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

// -----------------------------------------------------------------------------------
const ext = {
	// Unique name for the extension
	name: extension_name,
	init: async (app) => {
		// Any initial setup to run as soon as the page loads
	},
	setup: async (app) => {
		// Any setup to run after the app is created
    initDandy()
	},
	addCustomNodeDefs: async (defs, app) => {
		// Add custom node definitions
		// These definitions will be configured and registered automatically
		// defs is a lookup core nodes, add yours into this
	},
	getCustomWidgets: async (app) => {
    return {
      DANDYCAPTURE(node, inputName, inputData, app) {
        console.log("getCustomWidgets DANDYCAPTURE")
        return new_dandy_capture_widget(node, inputName, inputData, app)
      }
    }
	},
	beforeRegisterNodeDef: async (nodeType, nodeData, app) => {
		// Run custom logic before a node definition is registered with the graph
	},
	registerCustomNodes: async (app) => {
		// Register any custom node implementations here allowing for more flexability than a custom node def
  },
	loadedGraphNode: (node, app) => {
		// Fires for each node when loading/dragging/etc a workflow json or png
		// If you break something in the backend and want to patch workflows in the frontend
		// This is the place to do this
	},
	nodeCreated: (node, app) => {
    // Fires after a node is constructed
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
      "Dandy Land": DandyLand,
      "Dandy Js Loader": DandyJsLoader,
      "Dandy p5.js Loader": DandyP5JsLoader,
      "Dandy p5.js Setup": DandyP5JsSetup,
      "Dandy p5.js Draw": DandyP5JsDraw
    }

    when_up(() => {
      initDandyNode(o[node.getTitle()])
    })
	}
}

app.registerExtension(ext)



