from .client import DandyServicesClient
from .constants import *
from .dandynodes import *

class DandyLoader(DandyNode):
  CATEGORY = DANDY_LOADERS_CATEGORY
  OUTPUT_NODE = False

class DandyLoaderWithHashSocket(DandyWithHashSocket):
  CATEGORY = DANDY_LOADERS_CATEGORY
  OUTPUT_NODE = False

class DandyJsLoader(DandyLoader):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { JS_NAME: JS_TYPE_INPUT })
  
  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)

  def run(self, js=None, **kwargs):
    return (js,)

class DandyHtmlLoader(DandyLoader):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { HTML_NAME: HTML_TYPE_INPUT })

  RETURN_TYPES = (HTML_TYPE,)
  RETURN_NAMES = (HTML_NAME,)

  def run(self, html=None, **kwargs):
    return (html,)

class DandyCssLoader(DandyLoader):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { CSS_NAME: CSS_TYPE_INPUT })

  RETURN_TYPES = (CSS_TYPE,)
  RETURN_NAMES = (CSS_NAME,)

  def run(self, css=None, **kwargs):
    return (css,)

  
class DandyJsonLoader(DandyLoader):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { JSON_NAME: JSON_TYPE_INPUT })

  RETURN_TYPES = (JSON_TYPE,)
  RETURN_NAMES = (JSON_NAME,)

  def run(self, json=None, **kwargs):
    return (json,)

class DandyYamlLoader(DandyLoader):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { YAML_NAME: YAML_TYPE_INPUT })

  RETURN_TYPES = (YAML_TYPE,)
  RETURN_NAMES = (YAML_NAME,)

  def run(self, yaml=None, **kwargs):
    return (yaml,)


class DandyWasmLoader(DandyLoader):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { WASM_NAME: WASM_TYPE_INPUT })

  RETURN_TYPES = (WASM_TYPE,)
  RETURN_NAMES = (WASM_NAME,)

  def run(self, wasm=None, **kwargs):
    return (wasm,)

class DandyUrlLoader(DandyLoaderWithHashSocket):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { 
      HTML_NAME: HTML_TYPE_INPUT,
      CSS_NAME: CSS_TYPE_INPUT,
      JS_NAME: JS_TYPE_INPUT,
      WASM_NAME: WASM_TYPE_INPUT,
      JSON_NAME: JSON_TYPE_INPUT,
      YAML_NAME: YAML_TYPE_INPUT,
      IMAGE_URL_NAME: IMAGE_URL_TYPE_INPUT,
      STRING_NAME: STRING_TYPE_INPUT,
    })

  RETURN_TYPES = (HTML_TYPE, CSS_TYPE, JS_TYPE, WASM_TYPE, JSON_TYPE, YAML_TYPE, IMAGE_URL_TYPE, STRING_TYPE)
  RETURN_NAMES = (HTML_NAME, CSS_NAME, JS_NAME, WASM_NAME, JSON_NAME, YAML_NAME, IMAGE_URL_NAME, STRING_NAME)

  def run(self, service_id=None, html=None, css=None, js=None, wasm=None, json=None, yaml=None, image_url=None, **kwargs):
    out_string = self.client.request_string(service_id)
    return (html, css, js, wasm, json, yaml, image_url, out_string)

