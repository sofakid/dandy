from .image import make_b64image
from .constants import *

class DandyCollector:
  FUNCTION = 'run'
  OUTPUT_NODE = True
  CATEGORY = DANDY_CATEGORY

  def __init__(self):
    self.i = 0
    pass

  @classmethod
  def IS_CHANGED(self, dandy_dirty, **kwargs):
    if (dandy_dirty == True):
      self.i += 1
    return str(self.i).encode().hex()


class DandyImageCollector(DandyCollector):
  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      DIRTY_NAME: DIRTY_TYPE_INPUT,
      'image': ('IMAGE',),
      'mask': ('MASK',),
      IMAGE_URL_NAME: IMAGE_URL_TYPE_INPUT,
    })

  RETURN_TYPES = (IMAGE_URL_TYPE,)
  RETURN_NAMES = (IMAGE_URL_NAME,)

  def run(self, dandy_dirty, image=None, mask=None, image_url=None):
    image_url_out = list()

    if image is not None:
      for x in image:
        image_url_out.append(make_b64image(x))

    if mask is not None:
      for x in mask:
        image_url_out.append(make_b64image(x))

    return { 'ui': { 'image_url': image_url_out }, 
             'result': (image_url_out,) }


class DandyIntCollector(DandyCollector):

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      DIRTY_NAME: DIRTY_TYPE_INPUT,
      INT_NAME_1: INT_TYPE_INPUT,
      INT_NAME_2: INT_TYPE_INPUT,
    })

  RETURN_TYPES = (INT_TYPE,)
  RETURN_NAMES = (INT_NAME,)

  def run(self, dandy_dirty, int1=None, int2=None):
    int_out = list()

    if int1 is not None:
      for x in int1:
        int_out.append(x)
    
    if int2 is not None:
      for x in int2:
        int_out.append(x)

    return { 'ui': { 'int': int_out }, 
             'result': (int_out,) }


class DandyFloatCollector(DandyCollector):

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      DIRTY_NAME: DIRTY_TYPE_INPUT,
      FLOAT_NAME_1: FLOAT_TYPE_INPUT,
      FLOAT_NAME_2: FLOAT_TYPE_INPUT,
    })
  
  RETURN_TYPES = (FLOAT_TYPE,)
  RETURN_NAMES = (FLOAT_NAME,)

  def run(self, dandy_dirty, float1=None, float2=None):
    float_out = list()

    if float1 is not None:
      for x in float1:
        float_out.append(x)
    
    if float2 is not None:
      for x in float2:
        float_out.append(x)

    return { 'ui': { 'float': float_out }, 
             'result': (float_out,) }


class DandyBooleanCollector(DandyCollector):

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      DIRTY_NAME: DIRTY_TYPE_INPUT,
      BOOLEAN_NAME_1: BOOLEAN_TYPE_INPUT,
      BOOLEAN_NAME_2: BOOLEAN_TYPE_INPUT,
    })

  RETURN_TYPES = (BOOLEAN_TYPE,)
  RETURN_NAMES = (BOOLEAN_NAME,)

  def run(self, dandy_dirty, boolean1=None, boolean2=None):
    boolean_out = list()

    if boolean1 is not None:
      for x in boolean1:
        boolean_out.append(x)
    
    if boolean2 is not None:
      for x in boolean2:
        boolean_out.append(x)

    return { 'ui': { 'boolean': boolean_out }, 
             'result': (boolean_out,) }


class DandyStringCollector(DandyCollector):

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      DIRTY_NAME: DIRTY_TYPE_INPUT,
      STRING_NAME_1: STRING_TYPE_INPUT,
      STRING_NAME_2: STRING_TYPE_INPUT,
    })
  
  RETURN_TYPES = (STRING_TYPE,)
  RETURN_NAMES = (STRING_NAME,)

  def run(self, dandy_dirty, string1=None, string2=None):
    string_out = list()

    if string1 is not None:
      for x in string1:
        string_out.append(x)
    
    if string2 is not None:
      for x in string2:
        string_out.append(x)

    return { 'ui': { 'string': string_out }, 
             'result': (string_out,) }

