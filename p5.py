from .constants import *

class DandyP5JsLoader:
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


class DandyP5JsSetup:
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


class DandyP5JsDraw:
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
    return (js, )


