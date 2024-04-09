from .constants import *

def mixo(a, b):
  mixed = {}
  for key in a.keys():
    mixed[key] = {**a[key], **b[key]}
  return mixed

class DandyHashNode:
  def __init__(self):
      pass

  @classmethod
  def INPUT_TYPES(cls):
    our_inputs = DandyWidgets({
      HASH_NAME: HASH_TYPE_INPUT,
    })
    dandy_inputs = cls.DANDY_INPUTS()
    mixed = mixo(our_inputs, dandy_inputs)
    print("MIXED INPUTS: " + str(mixed))
    return mixed
  
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyWidgets({})

  @classmethod
  def IS_CHANGED(self, hash, **kwargs):
    return f'{hash}'.encode().hex()

  FUNCTION = 'run'
  OUTPUT_NODE = True
  CATEGORY = DANDY_CATEGORY
