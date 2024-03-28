import { app } from "../../scripts/app.js"
import { load_dandy_css } from "/extensions/dandy/dandycss.js"
import { DandyWidget, DandyTypes } from "/extensions/dandy/dandymisc.js"
import { initDandyEditors, DandyJs, DandyHtml, DandyYaml, DandyCss, DandyJson, DandyP5JsDraw, DandyP5JsSetup } from "/extensions/dandy/editors.js"
import { DandyLand } from "/extensions/dandy/dandyland.js"
import { DandyJsLoader, DandyP5JsLoader, DandyCssLoader, DandyHtmlLoader, DandyJsonLoader, DandyYamlLoader } from "./loaders.js"

const extension_name = "dandy"

const dandy_nodes = {
  "Dandy Land": DandyLand,
  "Dandy Js": DandyJs,
  "Dandy Json": DandyJson,
  "Dandy Yaml": DandyYaml,
  "Dandy Html": DandyHtml,
  "Dandy Css": DandyCss,
  "Dandy Js Loader": DandyJsLoader,
  "Dandy Json Loader": DandyJsonLoader,
  "Dandy Yaml Loader": DandyYamlLoader,
  "Dandy Css Loader": DandyCssLoader,
  "Dandy Html Loader": DandyHtmlLoader,
  "Dandy p5.js Loader": DandyP5JsLoader,
  "Dandy p5.js Setup": DandyP5JsSetup,
  "Dandy p5.js Draw": DandyP5JsDraw
}

const initDandy = async () => {
  load_dandy_css(document)
  await initDandyEditors()
}

// -----------------------------------------------------------------------------------
const ext = {
	// Unique name for the extension
	name: extension_name,
	init: async (app) => {
		// Any initial setup to run as soon as the page loads
    await initDandy()
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
    const o = {}
    Object.entries(DandyTypes).forEach(([_, type]) => {
      o[type] = (node, inputName, inputData, app) => {
        return new DandyWidget(node, inputName, inputData, app)
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
	}
}

app.registerExtension(ext)



