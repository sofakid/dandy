from .common import *
from .dandynodes import *
from .editors import DandyEditor

class DandyP5JsLoader(DandyNode):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { JS_NAME: JS_TYPE_INPUT })
  
  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  OUTPUT_NODE = False
  CATEGORY = DANDY_EXAMPLES_CATEGORY

  def run(self, js=None, **kwargs):
    return (js,)


class DandyP5JsSetup(DandyEditor):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { JS_NAME: JS_TYPE_INPUT })
  
  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  CATEGORY = DANDY_EXAMPLES_CATEGORY

  def run(self, js=None, **kwargs):
    return (js,)


class DandyP5JsDraw(DandyEditor):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { JS_NAME: JS_TYPE_INPUT })

  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  OUTPUT_NODE = False
  CATEGORY = DANDY_EXAMPLES_CATEGORY

  def run(self, js=None, **kwargs):
    return (js, )
