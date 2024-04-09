from .constants import *

class DandyEditor:
  def __init__(self):
      pass

  @classmethod
  def IS_CHANGED(self, hash, **kwargs):
    return f'{hash}'.encode().hex()

  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

class DandyJs(DandyEditor):
  
  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      HASH_NAME: HASH_TYPE_INPUT,
      JS_NAME: JS_TYPE_INPUT,
    })

  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)

  def run(self, hash, js):
    return (js,)


class DandyHtml(DandyEditor):

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      HASH_NAME: HASH_TYPE_INPUT,
      HTML_NAME: HTML_TYPE_INPUT,
    })

  RETURN_TYPES = (HTML_TYPE,)
  RETURN_NAMES = (HTML_NAME,)

  def run(self, hash, html):
    return (html,)


class DandyCss(DandyEditor):
  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      HASH_NAME: HASH_TYPE_INPUT,
      CSS_NAME: CSS_TYPE_INPUT,
    })
  
  RETURN_TYPES = (CSS_TYPE,)
  RETURN_NAMES = (CSS_NAME,)
  
  def run(self, hash, css):
    return (css,)

  
class DandyJson(DandyEditor):
  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      HASH_NAME: HASH_TYPE_INPUT,
      JSON_NAME: JSON_TYPE_INPUT,
    })  

  RETURN_TYPES = (JSON_TYPE,)
  RETURN_NAMES = (JSON_NAME,)

  def run(self, hash, js):
    return (js,)


class DandyYaml:
  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      HASH_NAME: HASH_TYPE_INPUT,
      YAML_NAME: YAML_TYPE_INPUT,
    })

  RETURN_TYPES = (YAML_TYPE,)
  RETURN_NAMES = (YAML_NAME,)
  
  def run(self, hash, yaml):
    return (yaml,)
  

class DandyString(DandyEditor):
  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      HASH_NAME: HASH_TYPE_INPUT,
      STRING_NAME: STRING_TYPE_INPUT,
    })

  RETURN_TYPES = (STRING_TYPE,)
  RETURN_NAMES = (STRING_NAME,)
  
  def run(self, hash, string):
    return (string,)

# --------------------------------------------------------------------
class DandyEditorSettings:
  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({})
  
  @classmethod
  def IS_CHANGED(self):
    return NEVER_CHANGE

  RETURN_TYPES = ()
  RETURN_NAMES = ()
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self):
    return ()

class DandyStringPreview(DandyEditor):
  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      HASH_NAME: HASH_TYPE_INPUT,
      STRING_NAME: STRING_TYPE_INPUT,
    })

  RETURN_TYPES = (STRING_TYPE,)
  RETURN_NAMES = (STRING_NAME,)
  
  def run(self, hash, string):
    return (string,)

# --------------------------------------------------------------------
class DandyEditorSettings:
  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({})
  
  @classmethod
  def IS_CHANGED(self):
    return NEVER_CHANGE

  RETURN_TYPES = ()
  RETURN_NAMES = ()
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self):
    return ()