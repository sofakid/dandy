from .client import DandyServicesClient
from .constants import *

def DandyRequiredInputs(cls, inputs):
  dandy_inputs = cls.DANDY_INPUTS()
  dandy_inputs['required'].update(inputs)
  return dandy_inputs

def DandyOptionalInputs(cls, inputs):
  dandy_inputs = cls.DANDY_INPUTS()
  dandy_inputs['optional'].update(inputs)
  return dandy_inputs

def DandyRequiredOptionalInputs(cls, required, optional):
  dandy_inputs = cls.DANDY_INPUTS()
  dandy_inputs['required'].update(required)
  dandy_inputs['optional'].update(optional)
  return dandy_inputs

class DandyNode:
  @classmethod
  def INPUT_TYPES(cls):
    mixed = cls.DANDY_INPUTS()
    # print("MIXED INPUTS: " + str(mixed))
    return mixed

  @classmethod
  def DANDY_INPUTS(cls):
    return { 'required': {}, 'hidden': {}, 'optional': {} }
  
  FUNCTION = 'run'
  OUTPUT_NODE = True
  CATEGORY = DANDY_CATEGORY
  RETURN_TYPES = ()
  RETURN_NAMES = ()

  @classmethod
  def IS_CHANGED(cls, **kwargs):
    return NEVER_CHANGE
  
  def run(self, **kwargs):
    return ()


class DandyWithHash(DandyNode):
  @classmethod
  def DANDY_INPUTS(cls):
    o = DandyOptionalInputs(super(), { HASH_NAME: HASH_TYPE_INPUT })
    # print("DandyWithHash :: " + str(o))
    return o

  @classmethod
  def IS_CHANGED(cls, hash='None', **kwargs):
    return f'{hash}'.encode().hex()

class DandyWithHashSocket(DandyWithHash):
  def __init__(self):
      self.client = DandyServicesClient()
      super().__init__()

  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { SERVICE_ID_NAME: SERVICE_ID_TYPE_INPUT })
