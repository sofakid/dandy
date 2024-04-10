import json
from .image import make_b64image
from .constants import *
from .dandynodes import *

class DandyCollector(DandyWithHash):
  CATEGORY = DANDY_COLLECTORS_CATEGORY
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { 'n_inputs': N_INPUTS_INPUT, })

class DandyImageCollector(DandyCollector):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { 
      'image': ('IMAGE',),
      'mask': ('MASK',),
    })
  
  RETURN_TYPES = (IMAGE_URL_TYPE,)
  RETURN_NAMES = (IMAGE_URL_NAME,)

  def run(self, image=None, mask=None, **kwargs):
    x = list()

    if image is not None:
      for y in image:
        x.append(make_b64image(y))

    if mask is not None:
      for y in mask:
        x.append(make_b64image(y))

    return ui_and_result(x)


class DandyIntCollector(DandyCollector):
  RETURN_TYPES = (INT_TYPE,)
  RETURN_NAMES = (INT_NAME,)

  def run(self, hash, **kwargs):
    x = []
    for key, value in kwargs.items():
      if key.startswith('int'):
        x.append(value)

    return ui_and_result(x)


class DandyFloatCollector(DandyCollector):
  RETURN_TYPES = (FLOAT_TYPE,)
  RETURN_NAMES = (FLOAT_NAME,)

  def run(self, hash, **kwargs):
    x = []
    for key, value in kwargs.items():
      if key.startswith('float'):
        x.append(value)

    return ui_and_result(x)


class DandyBooleanCollector(DandyCollector):
  RETURN_TYPES = (BOOLEAN_TYPE,)
  RETURN_NAMES = (BOOLEAN_NAME,)

  def run(self,**kwargs):
    x = []

    for key, value in kwargs.items():
      if key.startswith('boolean'):
        x.append(value)

    return ui_and_result(x)


class DandyStringCollector(DandyCollector):
  RETURN_TYPES = (STRING_TYPE,)
  RETURN_NAMES = (STRING_NAME,)

  def run(self, **kwargs):
    x = ""
    for key, value in kwargs.items():
      if key.startswith('string') and value != None:
        print("catting: " + str(value))
        x += value

    print("DandyStringCollector :: string_out: " + x)
    return ui_and_result(x)

