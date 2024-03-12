import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js"
import { ComfyWidgets } from "../../scripts/widgets.js";
//import { ace } from "./ace/ace.js";

const extension_name = "dandy"
const extension_webroot = "/extensions/dandy/"

let DANDY_INITIALIZED = false
const initDandy = () => {
  console.log("initDandy()")
  
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

const initDandyEditorNode = (node) => {
  console.log("initDandyEditorNode(node)", node)
  const editor_id = `dandy_editor_${node.id}`
  const div_id = `dandy_node_${node.id}`

  const dandy_div = document.createElement("div")
  dandy_div.classList.add("dandy-node")
  
	const widget = node.addDOMWidget(div_id, "dandydandydandy", dandy_div, {
		getValue() {
			return dandy_div.value;
		},
		setValue(v) {
			dandy_div.value = v;
		},
	});
  
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
  editor.setOption('hasCssTransforms', true); 
  

	editor_pre.addEventListener("resize", (event) => {
    console.log('Event type:', event.type);
    console.log('Event details:', event);
    editor.resize()
	})

  // let lastTransform = null
  // const observer = new MutationObserver(function(mutations) {
  //   mutations.forEach(function(mutation) {
  //     // if (mutation.type === 'attributes' && 
  //     //    (mutation.attributeName === 'style' || mutation.attributeName === 'transform')) {
  //     //   // Handle the style or transform change here
  //     if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
  //       const t = dandy_div.style.transform
  //       if (t !== lastTransform) {
  //         lastTransform = t
  //         console.log('transform changed:', t);
  //         // Adjust Ace editor or perform other necessary actions
  //         editor.resize()
  //         //editor.renderer.updateFull();
  //       }

  //     }
         
 
  //   });
  // });

  // const observerConfig = { attributes: true, attributeFilter: ['style', 'transform'], subtree: true };
  // observer.observe(dandy_div, observerConfig);
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
	},
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		// Run custom logic before a node definition is registered with the graph

		// This fires for every node definition so maybe only once
		//delete ext.beforeRegisterNodeDef;
	},
	async registerCustomNodes(app) {
		// Register any custom node implementations here allowing for more flexability than a custom node def
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
      }

    })
	}
};

app.registerExtension(ext);

