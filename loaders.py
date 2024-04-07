from .client import DandyServicesClient
from .constants import *

class DandyJsLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(s):
    return DandyWidgets({
      JS_NAME: JS_TYPE_INPUT
    })

  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE
  
  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, js):
    return (js,)


class DandyHtmlLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      HTML_NAME: HTML_TYPE_INPUT
    })
  
  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (HTML_TYPE,)
  RETURN_NAMES = (HTML_NAME,)
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, html):
    return (html,)


class DandyCssLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      CSS_NAME: CSS_TYPE_INPUT
    })
  
  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (CSS_TYPE,)
  RETURN_NAMES = (CSS_NAME,)
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, css):
    return (css,)

  
class DandyJsonLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      JSON_NAME: JSON_TYPE_INPUT
    })
  
  @classmethod
  def IS_CHANGED(self, json):
    return NEVER_CHANGE

  RETURN_TYPES = (JSON_TYPE,)
  RETURN_NAMES = (JSON_NAME,)
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, json):
    return (json,)


class DandyYamlLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      YAML_NAME: YAML_TYPE_INPUT
    })
  
  @classmethod
  def IS_CHANGED(self, yaml):
    return NEVER_CHANGE

  RETURN_TYPES = (YAML_TYPE,)
  RETURN_NAMES = (YAML_NAME,)
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, yaml):
    return (yaml,)


class DandyWasmLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      WASM_NAME: WASM_TYPE_INPUT
    })
   
  @classmethod
  def IS_CHANGED(self, wasm):
    return NEVER_CHANGE

  RETURN_TYPES = (WASM_TYPE,)
  RETURN_NAMES = (WASM_NAME,)
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, wasm):
    return (wasm,)


class DandyUrlLoader:
  def __init__(self):
    self.client = DandyServicesClient()
    pass

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      HASH_NAME: HASH_TYPE_INPUT,
      SERVICE_ID_NAME: SERVICE_ID_TYPE_INPUT,
      HTML_NAME: HTML_TYPE_INPUT,
      CSS_NAME: CSS_TYPE_INPUT,
      JS_NAME: JS_TYPE_INPUT,
      WASM_NAME: WASM_TYPE_INPUT,
      JSON_NAME: JSON_TYPE_INPUT,
      YAML_NAME: YAML_TYPE_INPUT,
      IMAGE_URL_NAME: IMAGE_URL_TYPE_INPUT,
      STRING_NAME: STRING_TYPE_INPUT,
    })

  @classmethod
  def IS_CHANGED(self, hash, service_id, html=None, css=None, js=None, wasm=None, json=None, yaml=None, image_url=None, string=None):
    return f'{hash}'.encode().hex()

  RETURN_TYPES = (HTML_TYPE, CSS_TYPE, JS_TYPE, WASM_TYPE, JSON_TYPE, YAML_TYPE, IMAGE_URL_TYPE, STRING_TYPE)
  RETURN_NAMES = (HTML_NAME, CSS_NAME, JS_NAME, WASM_NAME, JSON_NAME, YAML_NAME, IMAGE_URL_NAME, STRING_NAME)
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, hash, service_id, html=None, css=None, js=None, wasm=None, json=None, yaml=None, image_url=None, string=None):
    out_string = self.client.request_string(service_id)
    return (html, css, js, wasm, json, yaml, image_url, out_string)

