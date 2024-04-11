import json
import re
from .image import make_b64image, batch, make_image_from_b64, make_mask_from_b64
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
    })
  
  RETURN_TYPES = (IMAGE_TYPE, IMAGE_URL_TYPE,)
  RETURN_NAMES = (IMAGE_NAME, IMAGE_URL_NAME,)

  def run(self, **kwargs):
    urls = list()
    images = []
    image_input_re = r'image\d*'
    image_url_input_re = r'image_url\d*'

    for key, value in kwargs.items():
      if re.match(image_input_re, key) and value != None:
        for img in value:
          urls.append(make_b64image(img))
          images.append(img)

      if re.match(image_url_input_re, key) and value != None:
        for url in value:
          img = make_image_from_b64(url)
          images.append(img)
          urls.append(url)
    
    urls = '\n'.join(urls)
    batched, w, h = batch(images)
    return { 'ui': { 'value': [urls]}, 'result': [batched, urls] } 
  

class DandyMaskCollector(DandyCollector):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { 
    })
  
  RETURN_TYPES = (MASK_TYPE, IMAGE_URL_TYPE,)
  RETURN_NAMES = (MASK_NAME, IMAGE_URL_NAME,)

  def run(self, mask=None, image_url=None, **kwargs):
    urls = list()
    masks = []
    mask_input_re = r'mask\d+'
    image_url_input_re = r'image_url\d+'

    for key, value in kwargs.items():
      if re.match(mask_input_re, key) and value != None:
        for msk in value:
          urls.append(make_b64image(msk))
          masks.append(msk)

      if re.match(image_url_input_re, key) and value != None:
        for url in value:
          img = make_mask_from_b64(url)
          masks.append(img)
    
    batched, w, h = batch(masks)
    
    return { 'ui': { 'value': [urls]}, 'result': [batched, urls] } 


class DandyIntCollector(DandyCollector):
  RETURN_TYPES = (INT_TYPE,)
  RETURN_NAMES = (INT_NAME,)

  def run(self, **kwargs):
    x = []
    for key, value in kwargs.items():
      if key.startswith('int') and value != None:
        x.append(value)

    return ui_and_result(x)


class DandyFloatCollector(DandyCollector):
  RETURN_TYPES = (FLOAT_TYPE,)
  RETURN_NAMES = (FLOAT_NAME,)

  def run(self, **kwargs):
    x = []
    for key, value in kwargs.items():
      if key.startswith('float') and value != None:
        x.append(value)

    return ui_and_result(x)


class DandyBooleanCollector(DandyCollector):
  RETURN_TYPES = (BOOLEAN_TYPE,)
  RETURN_NAMES = (BOOLEAN_NAME,)

  def run(self,**kwargs):
    x = []

    for key, value in kwargs.items():
      if key.startswith('boolean') and value != None:
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

