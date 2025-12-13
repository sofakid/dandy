import { app } from "/scripts/app.js"
import { load_dandy_css } from "/extensions/dandy/dandycss.js"
import { DandyWidget, DandyTypes, dandy_delay } from "/extensions/dandy/dandymisc.js"
import { DandyImageCollector, DandyMaskCollector, DandyIntCollector, DandyBooleanCollector, 
         DandyFloatCollector, DandyStringArrayCollector, DandyStringCatCollector } from "/extensions/dandy/collectors.js"
import { DandyBooleanSplitter, DandyFloatSplitter, DandyIntSplitter, DandyStringArraySplitter } from "/extensions/dandy/splitters.js"
import { init_DandyEditors, DandyJs, DandyHtml, DandyYaml, DandyCss, DandyJson, DandyString, 
         DandyInt, DandyFloat } from "/extensions/dandy/editors.js"
import { DandyStringPreview, DandyIntPreview, DandyFloatPreview, DandyBooleanPreview } from "/extensions/dandy/previews.js"
import { DandyPrompt } from "/extensions/dandy/prompt.js"
import { DandyEditorSettings, wait_for_DandySettings, new_dandy_settings } from '/extensions/dandy/editor_settings.js'
import { DandyLand } from "/extensions/dandy/dandyland.js"
import { DandyJsLoader, DandyCssLoader, DandyHtmlLoader, DandyJsonLoader, 
         DandyYamlLoader, DandyWasmLoader, DandyUrlLoader } from "/extensions/dandy/loaders.js"
import { DandySocket, init_dandy_sockets } from "/extensions/dandy/socket.js"
import { DandyP5JsDraw, DandyP5JsSetup, DandyP5JsLoader } from '/extensions/dandy/examples/p5js.js'
import { DandyGradient } from '/extensions/dandy/examples/gradient_node.js'
import { DandyPixelsJs } from '/extensions/dandy/examples/pixelsjs_node.js'
import { DandyPixiJs } from '/extensions/dandy/examples/pixijs/pixijs_node.js'


const extension_name = "dandy"

const dandy_nodes = {
  "Dandy Land": DandyLand,
  "Dandy Js": DandyJs,
  "Dandy Json": DandyJson,
  "Dandy Yaml": DandyYaml,
  "Dandy Html": DandyHtml,
  "Dandy Css": DandyCss,

  "Dandy String": DandyString,
  "Dandy Int": DandyInt,
  "Dandy Float": DandyFloat,

  "Dandy Int Preview": DandyIntPreview,
  "Dandy Float Preview": DandyFloatPreview,
  "Dandy Boolean Preview": DandyBooleanPreview,
  "Dandy String Preview": DandyStringPreview,
  
  "Dandy Js Loader": DandyJsLoader,
  "Dandy Wasm Loader": DandyWasmLoader,
  "Dandy Json Loader": DandyJsonLoader,
  "Dandy Yaml Loader": DandyYamlLoader,
  "Dandy Css Loader": DandyCssLoader,
  "Dandy Html Loader": DandyHtmlLoader,
  "Dandy Url Loader": DandyUrlLoader,
  
  "Dandy p5.js Loader": DandyP5JsLoader,
  "Dandy p5.js Setup": DandyP5JsSetup,
  "Dandy p5.js Draw": DandyP5JsDraw,
  "Dandy Gradient": DandyGradient,
  "Dandy Pixels.JS": DandyPixelsJs,
  "Dandy PixiJS": DandyPixiJs,
  
  "Dandy Mask Collector": DandyMaskCollector,
  "Dandy Image Collector": DandyImageCollector,
  "Dandy Int Collector": DandyIntCollector,
  "Dandy Float Collector": DandyFloatCollector,
  "Dandy Boolean Collector": DandyBooleanCollector,
  "Dandy String Array Collector": DandyStringArrayCollector,
  "Dandy String Cat Collector": DandyStringCatCollector,

  "Dandy Int Splitter": DandyIntSplitter,
  "Dandy Float Splitter": DandyFloatSplitter,
  "Dandy Boolean Splitter": DandyBooleanSplitter,
  "Dandy String Array Splitter": DandyStringArraySplitter,
  
  "Dandy Editor Settings": DandyEditorSettings,
  "Dandy Prompt": DandyPrompt,
}

const init_dandy = async () => {
  load_dandy_css(document)
  await init_dandy_sockets(app)
  new_dandy_settings()
  await wait_for_DandySettings()
  await init_DandyEditors()
  await dandy_delay(200)
}


// -----------------------------------------------------------------------------------
const ext = {
	// Unique name for the extension
	name: extension_name,
	init: async () => {
		// Any initial setup to run as soon as the page loads
    await init_dandy()
	},
	setup: async () => {
    // Any setup to run after the app is created
	},
	addCustomNodeDefs: async (defs, app) => {
		// Add custom node definitions
		// These definitions will be configured and registered automatically
		// defs is a lookup core nodes, add yours into this
	},
	getCustomWidgets: async (app) => {
    const o = {}
    Object.entries(DandyTypes).forEach(([_, type]) => {
      o[type] = (node, inputName, inputData, app) => {
        return new DandyWidget(node, inputName, inputData[0], inputData[1])
      }
    })
    return o
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

    const klass = dandy_nodes[node.getTitle()]
    // console.log("nodeCreated", node.getTitle(), klass)
    if (klass) {
      node.dandy = new klass(node, app)
    }
	},
}


if (window.dandy_loaded) {
  console.warn("Dandy :: Extension already loaded :: aborting")
} else {
  window.dandy_loaded = true
  app.registerExtension(ext)
}



