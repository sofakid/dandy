from .constants import *
    
class DandyJs:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
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


class DandyHtml:
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


class DandyCss:
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

  
class DandyJson:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      JSON_NAME: JSON_TYPE_INPUT
    })  
  
  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (JSON_TYPE,)
  RETURN_NAMES = (JSON_NAME,)
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, js):
    return (js,)


class DandyYaml:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      YAML_NAME: YAML_TYPE_INPUT
    })
  
  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (YAML_TYPE,)
  RETURN_NAMES = (YAML_NAME,)
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, yaml):
    return (yaml,)

class DandyEditorSettings:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      YAML_NAME: YAML_TYPE_INPUT
    })
  
  @classmethod
  def IS_CHANGED(self, yaml=None):
    return NEVER_CHANGE

  RETURN_TYPES = ()
  RETURN_NAMES = ()
  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, yaml=None):
    return ()