import multiprocessing as mp
from .editors import *
from .loaders import *
from .dandyland import *
from .p5 import *
from .prompt import *
from .collectors import *
from .socket import launch_server

WEB_DIRECTORY = "web"

NODE_CLASS_MAPPINGS = {
  "DandyLand": DandyLand,
  "DandyJs": DandyJs,
  "DandyJson": DandyJson,
  "DandyYaml": DandyYaml,
  "DandyCss": DandyCss,
  "DandyHtml": DandyHtml,
  "DandyString": DandyString,
  "DandyStringPreview": DandyStringPreview,
  "DandyP5JsSetup": DandyP5JsSetup,
  "DandyP5JsDraw": DandyP5JsDraw,
  "DandyJsLoader": DandyJsLoader,
  "DandyP5JsLoader": DandyP5JsLoader,
  "DandyJsonLoader": DandyJsonLoader,
  "DandyYamlLoader": DandyYamlLoader,
  "DandyWasmLoader": DandyWasmLoader,
  "DandyCssLoader": DandyCssLoader,
  "DandyHtmlLoader": DandyHtmlLoader,
  "DandyUrlLoader": DandyUrlLoader,
  "DandyImageCollector": DandyImageCollector,
  "DandyIntCollector": DandyIntCollector,
  "DandyFloatCollector": DandyFloatCollector,
  "DandyBooleanCollector": DandyBooleanCollector,
  "DandyStringCollector": DandyStringCollector,
  "DandyEditorSettings": DandyEditorSettings,
  "DandyPrompt": DandyPrompt,
}

NODE_DISPLAY_NAME_MAPPINGS = {
  "DandyLand": "Dandy Land",
  "DandyJs": "Dandy Js",
  "DandyHtml": "Dandy Html",
  "DandyCss": "Dandy Css",
  "DandyJson": "Dandy Json",
  "DandyYaml": "Dandy Yaml",
  "DandyString": "Dandy String",
  "DandyStringPreview": "Dandy String Preview",
  "DandyJsLoader": "Dandy Js Loader",
  "DandyJsonLoader": "Dandy Json Loader",
  "DandyYamlLoader": "Dandy Yaml Loader",
  "DandyWasmLoader": "Dandy Wasm Loader",
  "DandyCssLoader": "Dandy Css Loader",
  "DandyHtmlLoader": "Dandy Html Loader",
  "DandyUrlLoader": "Dandy Url Loader",
  "DandyP5JsLoader": "Dandy p5.js Loader",
  "DandyP5JsSetup": "Dandy p5.js Setup",
  "DandyP5JsDraw": "Dandy p5.js Draw",
  "DandyImageCollector": "Dandy Image Collector",
  "DandyIntCollector": "Dandy Int Collector",
  "DandyFloatCollector": "Dandy Float Collector",
  "DandyBooleanCollector": "Dandy Boolean Collector",
  "DandyStringCollector": "Dandy String Collector",
  "DandyPrompt": "Dandy Prompt",
  "DandyEditorSettings": "Dandy Editor Settings",
}

if mp.current_process().name == 'MainProcess':
  print("DandySocket :: launching server")
  launch_server()
