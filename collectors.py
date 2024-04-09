import json
from .dandynodes import DandyHashNode
from .image import make_b64image
from .constants import *

class DandyCollector(DandyHashNode):
  CATEGORY = DANDY_COLLECTORS_CATEGORY

class DandyImageCollector(DandyCollector):
  @classmethod
  def DANDY_INPUTS(self):
    return DandyWidgets({
      'image': ('IMAGE',),
      'mask': ('MASK',),
      'n_inputs': N_INPUTS_INPUT,
    })

  RETURN_TYPES = (IMAGE_URL_TYPE,)
  RETURN_NAMES = (IMAGE_URL_NAME,)

  def run(self, hash, image=None, mask=None, **kwargs):
    x = list()

    if image is not None:
      for y in image:
        x.append(make_b64image(y))

    if mask is not None:
      for y in mask:
        x.append(make_b64image(y))

    return ui_and_result(x)


class DandyIntCollector(DandyCollector):
  @classmethod
  def DANDY_INPUTS(self):
    return DandyWidgets({ 'n_inputs': N_INPUTS_INPUT, })
  
  RETURN_TYPES = (INT_TYPE,)
  RETURN_NAMES = (INT_NAME,)

  def run(self, hash, **kwargs):
    x = []
    for key, value in kwargs.items():
      if key.startswith('int'):
        x.append(value)

    return ui_and_result(x)


class DandyFloatCollector(DandyCollector):
  @classmethod
  def DANDY_INPUTS(self):
    return DandyWidgets({ 'n_inputs': N_INPUTS_INPUT, })
  
  RETURN_TYPES = (FLOAT_TYPE,)
  RETURN_NAMES = (FLOAT_NAME,)

  def run(self, hash, **kwargs):
    x = []
    for key, value in kwargs.items():
      if key.startswith('float'):
        x.append(value)

    return ui_and_result(x)


class DandyBooleanCollector(DandyCollector):
  @classmethod
  def DANDY_INPUTS(self):
    return DandyWidgets({ 'n_inputs': N_INPUTS_INPUT, })
  
  RETURN_TYPES = (BOOLEAN_TYPE,)
  RETURN_NAMES = (BOOLEAN_NAME,)

  def run(self, hash, **kwargs):
    x = []

    for key, value in kwargs.items():
      if key.startswith('boolean'):
        x.append(value)

    return ui_and_result(x)


class DandyStringCollector(DandyCollector):
  @classmethod
  def DANDY_INPUTS(self):
    return DandyWidgets({ 'n_inputs': N_INPUTS_INPUT, })
  
  RETURN_TYPES = (STRING_TYPE,)
  RETURN_NAMES = (STRING_NAME,)

  def run(self, **kwargs):
    x = ""
    for key, value in kwargs.items():
      if key.startswith('string'):
        print("catting: " + str(value))
        x += value + "\n"

    print("DandyStringCollector :: string_out: " + x)
    return ui_and_result(x)

