import hashlib
import folder_paths
from .constants import *
from .socket import send_data
from .image import *
    
class DandyLand:
  def __init__(self):
    pass
  
  @classmethod
  def INPUT_TYPES(s):
    return DandyWidgets({
        #'seed': ('SEED',),
        CAPTURE_NAME: CAPTURE_TYPE_INPUT,
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
  def IS_CHANGED(self, captures, html=None, css=None, js=None, json=None, 
                 yaml=None, wasm=None, width=None, height=None, b64images=None, 
                 b64masks=None):
    m = hashlib.sha256()
    for capture in captures.split('\n'):
      image_path = folder_paths.get_annotated_filepath(capture)
      with open(image_path, 'rb') as f:
        m.update(f.read())
    return m.digest().hex()
  
  RETURN_TYPES = ('IMAGE', 'MASK')
  RETURN_NAMES = ('images', 'masks')
  FUNCTION = 'run'
  OUTPUT_NODE = True
  CATEGORY = DANDY_CATEGORY

  def run(self, captures, html=None, css=None, js=None, json=None, 
          yaml=None, wasm=None, width=None, height=None, b64images=None, 
          b64masks=None):
    
    send_data({'DandyLand': 'DandyLand.run'})

    print('DandyLand :: captures: ' + str(captures) + ' :: js: ' + str(js))
    
    files = list(filter(lambda x: x.split(), captures.split('\n')))
    def f(g):
      return list(map(lambda x: g(x), files))

    print('DandyLand :: files: <' + str(files) + '>')

    output_images = f(make_image)
    #output_masks = f(make_mask)

    output_image = batch(output_images)
    #output_mask = batch(output_masks)
    output_mask = torch.zeros((512, 512), dtype=torch.float32, device='cpu')[None,]
    
    return (output_image, output_mask)
