from .dandynodes import DandyWithHash
from .constants import *
from .dandynodes import *

class DandyEditor(DandyWithHashSocket):
  OUTPUT_NODE = False
  @classmethod
  def DANDY_INPUTS(cls):
    return super().DANDY_INPUTS()
    
class DandyJs(DandyEditor):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(),{ JS_NAME: JS_TYPE_INPUT })

  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)

  def run(self, js=None, **kwargs):
    return (js,)


class DandyHtml(DandyEditor):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(),{ HTML_NAME: HTML_TYPE_INPUT })

  RETURN_TYPES = (HTML_TYPE,)
  RETURN_NAMES = (HTML_NAME,)

  def run(self, html=None, **kwargs):
    return (html,)


class DandyCss(DandyEditor):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(),{ CSS_NAME: CSS_TYPE_INPUT })
  
  RETURN_TYPES = (CSS_TYPE,)
  RETURN_NAMES = (CSS_NAME,)
  
  def run(self, css=None, **kwargs):
    return (css,)

  
class DandyJson(DandyEditor):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(),{ JSON_NAME: JSON_TYPE_INPUT })
  
  RETURN_TYPES = (JSON_TYPE,)
  RETURN_NAMES = (JSON_NAME,)

  def run(self, js=None, **kwargs):
    return (js,)


class DandyYaml(DandyEditor):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(),{ YAML_NAME: YAML_TYPE_INPUT })

  RETURN_TYPES = (YAML_TYPE,)
  RETURN_NAMES = (YAML_NAME,)
  
  def run(self, yaml=None, **kwargs):
    return (yaml,)
  

# --------------------------------------------------------------------
class DandyEditorSettings(DandyNode):
  OUTPUT_NODE = False
  
# ----------------------------------------------------------------------------
class DandyString(DandyEditor):
  RETURN_TYPES = (STRING_TYPE,)
  RETURN_NAMES = (STRING_NAME,)
  
  def run(self, **kwargs):
    string = kwargs.get('string', '')
    service_id = kwargs.get('service_id', '0')
    print(f'DandyString :: string: {str(string)}, service_id: ${str(service_id)}')
    o = self.client.send_input(service_id, kwargs)
    out_string = o['output']['string']
    return (out_string,)

