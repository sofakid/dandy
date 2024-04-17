from .image import make_b64image, batch, make_image_from_b64, make_mask_from_b64, make_b64mask
from .constants import *
from .dandynodes import *

def flatten(lst):
  flattened = []
  for x in lst:
    if isinstance(x, list):
      flattened.extend(flatten(x))
    else:
      flattened.append(x)
  return flattened

def string_cat(lst):
  cat = ""
  for x in lst:
      if isinstance(x, list):
          cat += string_cat(x)
      elif isinstance(x, str):
          cat += x
      else:
          cat += str(x)
  return cat

class DandySplitter(DandyWithHash):
  CATEGORY = DANDY_SPLITTERS_CATEGORY
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { 'n_outputs': N_OUTPUTS_INPUT, })

  def input_name_prefix(self):
    return 'whoopsydaisies'

  def run(self, **kwargs):
    n_outputs = kwargs['n_outputs']
    inputs = []
    
    for key, value in kwargs.items():
      if key.startswith(self.input_name_prefix()) and value != None:
        inputs.append(value)

    inputs = flatten(inputs)
    n_inputs = len(inputs)
    n = min(n_inputs, n_outputs)
    out = []

    if n > 0:
      for i in range(0, n_outputs):
        j = i % n
        out.append(inputs[j])

    return ui_and_result(*out)

class DandyIntSplitter(DandySplitter):
  def input_name_prefix(self):
    return 'int'

class DandyFloatSplitter(DandySplitter):
  def input_name_prefix(self):
    return 'float'

class DandyBooleanSplitter(DandySplitter):
  def input_name_prefix(self):
    return 'boolean'

class DandyStringArraySplitter(DandySplitter):
  def input_name_prefix(self):
    return 'string'



