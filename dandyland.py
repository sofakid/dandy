import hashlib
import folder_paths
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
        #'seed': ('SEED',),
        HASH_NAME: HASH_TYPE_INPUT,  
        SERVICE_ID_NAME: SERVICE_ID_TYPE_INPUT,
        HTML_NAME: HTML_TYPE_INPUT,
        CSS_NAME: CSS_TYPE_INPUT,
        JS_NAME: JS_TYPE_INPUT,
        JSON_NAME: JSON_TYPE_INPUT,
        YAML_NAME: YAML_TYPE_INPUT,
        WASM_NAME: WASM_TYPE_INPUT,
        'width': WIDTH_HEIGHT_INPUT,
        'height': WIDTH_HEIGHT_INPUT,
        B64IMAGES_NAME: B64IMAGES_TYPE_INPUT,
        B64MASKS_NAME: B64MASKS_TYPE_INPUT,
    })

  @classmethod
  def IS_CHANGED(self, hash, service_id, html=None, css=None, js=None, json=None, 
                 yaml=None, wasm=None, width=None, height=None, b64images=None, 
                 b64masks=None):
    print(f'DandyLand :: IS_CHANGED {hash}')
    return hash
    
  RETURN_TYPES = ('IMAGE', 'MASK')
  RETURN_NAMES = ('images', 'masks')
  FUNCTION = 'run'
  OUTPUT_NODE = True
  CATEGORY = DANDY_CATEGORY

  def run(self, hash, service_id, html=None, css=None, js=None, json=None, 
          yaml=None, wasm=None, width=None, height=None, b64images=None, 
          b64masks=None):
    
    b64s = self.client.request_captures(service_id)
    print('Dandyland :: captures from services: ' + str(b64s)[:80])
    
    def f(g):
      return list(map(lambda x: g(x), b64s))

    output_images = f(make_image_from_b64)
    #output_masks = f(make_mask_from_b64)

    output_image = batch(output_images)
    #output_mask = batch(output_masks)
    output_mask = torch.zeros((512, 512), dtype=torch.float32, device='cpu')[None,]
    
    return (output_image, output_mask)
