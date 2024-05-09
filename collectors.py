import re
from .image import make_b64image, batch_images, batch_masks, make_image_from_b64, make_mask_from_b64, make_b64mask
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
    return DandyOptionalInputs(super(), {})
  
  RETURN_TYPES = (IMAGE_URL_TYPE, IMAGE_TYPE)
  RETURN_NAMES = (IMAGE_URL_NAME, IMAGE_NAME)

  def run(self, **kwargs):
    urls = []
    images = []
    image_input_re = r'image(?!_url)\d*'
    image_url_input_re = r'image_url\d*'

    for key, value in kwargs.items():
      if re.match(image_url_input_re, key) and value != None:
        print("DandyImageCollector :: image_url :: " + str(value)[:80])
        for url in value.split('\n'):
          print("DandyImageCollector :: url :: " + str(url)[:80])
          img = make_image_from_b64(url)
          images.append(img)
          urls.append(url)
    
    for key, value in kwargs.items():
      if re.match(image_input_re, key) and value != None:
        print("DandyImageCollector :: image :: " + str(value.size(0)) + " :: " + str(type(value)))
        for img in value:
          print("DandyImageCollector :: img  :: " + str(img.size(0)) + " :: " + str(type(img)))
          urls.append(make_b64image(img))
          images.append(img)

    urls = '\n'.join(urls)
    batched, w, h = batch_images(images)
    return { 'ui': { 'value': [urls]}, 'result': [urls, batched] } 
  

class DandyMaskCollector(DandyCollector):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), { 
    })
  
  RETURN_TYPES = (IMAGE_URL_TYPE, MASK_TYPE)
  RETURN_NAMES = (IMAGE_URL_NAME, MASK_NAME)

  def run(self, **kwargs):
    urls = []
    masks = []
    mask_input_re = r'mask\d*'
    image_url_input_re = r'image_url\d*'

    for key, value in kwargs.items():
      print("DandyMaskCollector :: key :: " + str(key)[:80])
      if re.match(image_url_input_re, key) and value != None:
        print("DandyMaskCollector :: image_url :: " + str(value)) 

        for url in value.split('\n'):
          msk = make_mask_from_b64(url)
          masks.append(msk)
          grey_url = make_b64mask(msk)
          urls.append(grey_url)
    
    for key, value in kwargs.items():
      if re.match(mask_input_re, key) and value != None:
        print("DandyMaskCollector :: mask :: " + str(value.size(0)) 
              + " :: " + str(type(value)) + " :: " + str(value.shape))
        urls.append(make_b64mask(value))
        masks.append(value)

    batched, w, h = batch_masks(masks)
    urls = '\n'.join(urls)
    print("DandyMaskCollector :: Batched masks :: " + str(batched.size(0)))
    
    return { 'ui': { 'value': [urls]}, 'result': [urls, batched] } 


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

class DandyIntCollector(DandyCollector):
  RETURN_TYPES = (INT_TYPE,)
  RETURN_NAMES = (INT_NAME,)

  def run(self, **kwargs):
    x = []
    for key, value in kwargs.items():
      if key.startswith('int') and value != None:
        print("Value" + str(value))
        x.append(value)

    x = flatten(x)

    return ui_and_result(x)


class DandyFloatCollector(DandyCollector):
  RETURN_TYPES = (FLOAT_TYPE,)
  RETURN_NAMES = (FLOAT_NAME,)

  def run(self, **kwargs):
    x = []
    for key, value in kwargs.items():
      if key.startswith('float') and value != None:
        x.append(value)

    x = flatten(x)
    return ui_and_result(x)


class DandyBooleanCollector(DandyCollector):
  RETURN_TYPES = (BOOLEAN_TYPE,)
  RETURN_NAMES = (BOOLEAN_NAME,)

  def run(self, **kwargs):
    x = []

    for key, value in kwargs.items():
      if key.startswith('boolean') and value != None:
        x.append(value)

    x = flatten(x)
    return ui_and_result(x)


class DandyStringArrayCollector(DandyCollector):
  RETURN_TYPES = (STRING_TYPE,)
  RETURN_NAMES = (STRING_NAME,)

  def run(self, **kwargs):
    print(f'DandyStringArrayCollector :: kwargs: ${str(kwargs)}')
    x = []
    for key, value in kwargs.items():
      if key.startswith('string') and value != None:
        x.append(value)

    x = flatten(x)
    return ui_and_result(x)

class DandyStringCatCollector(DandyCollector):
  RETURN_TYPES = (STRING_TYPE,)
  RETURN_NAMES = (STRING_NAME,)

  def run(self, **kwargs):
    x = []
    for key, value in kwargs.items():
      if key.startswith('string') and value != None:
        x.append(value)

    x = string_cat(x)    
    return ui_and_result(x)


