from .common import *
from .dandynodes import *
from .editors import DandyEditor

class DandyPreview(DandyEditor):
  CATEGORY = DANDY_PREVIEWS_CATEGORY
  OUTPUT_NODE = True
  @classmethod
  def DANDY_INPUTS(cls):
    return super().DANDY_INPUTS()
  
class DandyStringPreview(DandyPreview):
  RETURN_TYPES = (STRING_TYPE,)
  RETURN_NAMES = (STRING_NAME,)

  def run(self, **kwargs):
    string = kwargs.get('string', '')
    service_id = kwargs.get('service_id', '0')
    print(f'DandyStringPreview :: string: {str(string)}, service_id: ${str(service_id)}')
    o = self.client.send_input(service_id, kwargs)
    return (string,)

class DandyIntPreview(DandyPreview):
  RETURN_TYPES = (INT_TYPE,)
  RETURN_NAMES = (INT_NAME,)

  def run(self, **kwargs):
    kw = dict(kwargs)
    int = kw['int'] = dandy_flatten(kw.get('int', 0))
    service_id = kw.get('service_id', '0')
    o = self.client.send_input(service_id, kw)
    return ui_and_result(int)

class DandyFloatPreview(DandyPreview):
  RETURN_TYPES = (FLOAT_TYPE,)
  RETURN_NAMES = (FLOAT_NAME,)

  def run(self, **kwargs):
    kw = dict(kwargs)
    float = kw['float'] = dandy_flatten(kw.get('float', 0.0))
    service_id = kwargs.get('service_id', '0')
    print(f'DandyFloatPreview :: float: {str(float)}, service_id: ${str(service_id)}')
    o = self.client.send_input(service_id, kwargs)
    return (float,)


class DandyBooleanPreview(DandyPreview):
  RETURN_TYPES = (BOOLEAN_TYPE,)
  RETURN_NAMES = (BOOLEAN_NAME,)
  
  def run(self, **kwargs):
    kw = dict(kwargs)
    boolean = kw['boolean'] = dandy_flatten(kw.get('boolean', False))
    service_id = kwargs.get('service_id', '0')
    print(f'DandyBooleanPreview :: boolean: {str(boolean)}, service_id: ${str(service_id)}')
    o = self.client.send_input(service_id, kwargs)
    return (boolean,)
