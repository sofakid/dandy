import multiprocessing as mp
from .editors import *
from .previews import *
from .loaders import *
from .dandyland import *
from .p5 import *
from .prompt import *
from .collectors import *
from .splitters import *
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
  "DandyIntPreview": DandyIntPreview,
  "DandyFloatPreview": DandyFloatPreview,
  "DandyBooleanPreview": DandyBooleanPreview,
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
  "DandyMaskCollector": DandyMaskCollector,
  "DandyIntCollector": DandyIntCollector,
  "DandyFloatCollector": DandyFloatCollector,
  "DandyBooleanCollector": DandyBooleanCollector,
  "DandyStringArrayCollector": DandyStringArrayCollector,
  "DandyStringCatCollector": DandyStringCatCollector,
  "DandyIntSplitter": DandyIntSplitter,
  "DandyFloatSplitter": DandyFloatSplitter,
  "DandyBooleanSplitter": DandyBooleanSplitter,
  "DandyStringArraySplitter": DandyStringArraySplitter,
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
  "DandyIntPreview": "Dandy Int Preview",
  "DandyFloatPreview": "Dandy Float Preview",
  "DandyBooleanPreview": "Dandy Boolean Preview",
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
  "DandyMaskCollector": "Dandy Mask Collector",
  "DandyIntCollector": "Dandy Int Collector",
  "DandyFloatCollector": "Dandy Float Collector",
  "DandyBooleanCollector": "Dandy Boolean Collector",
  "DandyStringArrayCollector": "Dandy String Array Collector",
  "DandyIntSplitter": "Dandy Int Splitter",
  "DandyFloatSplitter": "Dandy Float Splitter",
  "DandyBooleanSplitter": "Dandy Boolean Splitter",
  "DandyStringArraySplitter": "Dandy String Array Splitter",
  "DandyPrompt": "Dandy Prompt",
  "DandyEditorSettings": "Dandy Editor Settings",
}

if mp.current_process().name == 'MainProcess':
  print("DandySocket :: launching server")
  launch_server()
