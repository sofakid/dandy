from .common import *
from .dandynodes import *

class DandyEditor(DandyWithHashSocket):
  OUTPUT_NODE = False
  @classmethod
  def DANDY_INPUTS(cls):
    return super().DANDY_INPUTS()
  
  def run(self, **kwargs):
    return ()
    
class DandyJs(DandyEditor):
  pass

class DandyHtml(DandyEditor):
  pass

class DandyCss(DandyEditor):
  pass

class DandyJson(DandyEditor):
  pass

class DandyYaml(DandyEditor):
  pass
  
  
# ----------------------------------------------------------------------------
class DandyString(DandyEditor):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { STRING_NAME: STRING_TYPE })
  
  RETURN_TYPES = (STRING_TYPE,)
  RETURN_NAMES = (STRING_NAME,)
  
  def run(self, **kwargs):
    # string = kwargs.get('string', '')
    service_id = kwargs.get('service_id', '0')
    o = self.client.send_input(service_id, kwargs)
    out = o['output']['string']
    return (out,)

class DandyInt(DandyEditor):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { INT_NAME: INT_TYPE })
  
  RETURN_TYPES = (INT_TYPE,)
  RETURN_NAMES = (INT_NAME,)
  
  def run(self, **kwargs):
    kw = dict(kwargs)
    kw['int'] = dandy_flatten(kw.get('int'))
    service_id = kw.get('service_id', '0')
    o = self.client.send_input(service_id, kw)
    out = dandy_flatten(o['output']['int'])
    return (out,)

class DandyFloat(DandyEditor):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { FLOAT_NAME: FLOAT_TYPE })
  
  RETURN_TYPES = (FLOAT_TYPE,)
  RETURN_NAMES = (FLOAT_NAME,)
  
  def run(self, **kwargs):
    kw = dict(kwargs)
    kw['float'] = dandy_flatten(kw.get('float'))
    service_id = kw.get('service_id', '0')
    o = self.client.send_input(service_id, kw)
    out = dandy_flatten(o['output']['float'])
    return (out,)


# --------------------------------------------------------------------
class DandyEditorSettings(DandyNode):
  OUTPUT_NODE = False