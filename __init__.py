from .editors import *
from .loaders import *
from .dandyland import *
from .p5 import *

WEB_DIRECTORY = "web"

NODE_CLASS_MAPPINGS = {
  "DandyLand": DandyLand,
  "DandyJs": DandyJs,
  "DandyJson": DandyJson,
  "DandyYaml": DandyYaml,
  "DandyCss": DandyCss,
  "DandyHtml": DandyHtml,
  "DandyP5JsSetup": DandyP5JsSetup,
  "DandyP5JsDraw": DandyP5JsDraw,
  "DandyJsLoader": DandyJsLoader,
  "DandyP5JsLoader": DandyP5JsLoader,
  "DandyJsonLoader": DandyJsonLoader,
  "DandyYamlLoader": DandyYamlLoader,
  "DandyCssLoader": DandyCssLoader,
  "DandyHtmlLoader": DandyHtmlLoader,
  "DandyUrlLoader": DandyUrlLoader,
  "DandyB64Encoder": DandyB64Encoder,
}

NODE_DISPLAY_NAME_MAPPINGS = {
  "DandyLand": "Dandy Land",
  "DandyB64Encoder": "Dandy B64 Encoder",
  "DandyJs": "Dandy Js",
  "DandyHtml": "Dandy Html",
  "DandyCss": "Dandy Css",
  "DandyJson": "Dandy Json",
  "DandyYaml": "Dandy Yaml",
  "DandyJsLoader": "Dandy Js Loader",
  "DandyJsonLoader": "Dandy Json Loader",
  "DandyYamlLoader": "Dandy Yaml Loader",
  "DandyCssLoader": "Dandy Css Loader",
  "DandyHtmlLoader": "Dandy Html Loader",
  "DandyUrlLoader": "Dandy Url Loader",
  "DandyP5JsLoader": "Dandy p5.js Loader",
  "DandyP5JsSetup": "Dandy p5.js Setup",
  "DandyP5JsDraw": "Dandy p5.js Draw",
}
