from .constants import *
from .client import DandyServicesClient
from .image import *
    
class DandyLand:
  def __init__(self):
    self.client = DandyServicesClient()
    pass
  
  @classmethod
  def INPUT_TYPES(s):
    return DandyWidgets({
      HASH_NAME: HASH_TYPE_INPUT,  
      SERVICE_ID_NAME: SERVICE_ID_TYPE_INPUT,
      'seed': ('SEED',),
      'image': ('IMAGE',),
      'mask': ('MASK',),
      HTML_NAME: HTML_TYPE_INPUT,
      CSS_NAME: CSS_TYPE_INPUT,
      JS_NAME: JS_TYPE_INPUT,
      WASM_NAME: WASM_TYPE_INPUT,
      JSON_NAME: JSON_TYPE_INPUT,
      YAML_NAME: YAML_TYPE_INPUT,
      IMAGE_URL_NAME: IMAGE_URL_TYPE_INPUT,
      'width': WIDTH_HEIGHT_INPUT,
      'height': WIDTH_HEIGHT_INPUT,
    })

  @classmethod
  def IS_CHANGED(self, hash, service_id, seed=None, images=None, masks=None, html=None, css=None, js=None, wasm=None, json=None, 
                 yaml=None, image_url=None, width=None, height=None):
    print(f'DandyLand :: IS_CHANGED {hash}')
    return hash
    
  RETURN_TYPES = ('IMAGE', 'MASK')
  RETURN_NAMES = ('image', 'mask')
  FUNCTION = 'run'
  OUTPUT_NODE = True
  CATEGORY = DANDY_CATEGORY

  def run(self, hash, service_id, seed=None, images=None, masks=None, html=None, css=None, js=None, wasm=None, json=None, 
          yaml=None, image_url=None, width=None, height=None):
    
    if images != None:
      b64inputs = []
      for image in images:
        b64 = make_b64image(image)
        b64inputs.append(b64)
      self.client.deliver_images(service_id, b64inputs)

    if masks != None:
      b64inputs = []
      for mask in masks:
        b64 = make_b64image(mask)
        b64inputs.append(b64)
      self.client.deliver_masks(service_id, b64inputs)

    b64s = self.client.request_captures(service_id)
    
    def f(g):
      return list(map(lambda x: g(x), b64s))

    output_images = f(make_image_from_b64)
    output_masks = f(make_mask_from_b64)

    output_images_batch = batch(output_images)
    output_masks_batch = batch(output_masks)
    
    return (output_images_batch, output_masks_batch)
