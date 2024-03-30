import torch
import base64
import folder_paths
from io import BytesIO
from PIL import Image, ImageOps
from PIL.PngImagePlugin import PngInfo
import numpy as np
import hashlib
import comfy.utils

MAX_RESOLUTION = 12800
WIDTH_HEIGHT_INPUT = ("INT", {"default": 512, "min": 10, "max": MAX_RESOLUTION, "step": 128})
NEVER_CHANGE = "never change".encode().hex()
DANDY_CATEGORY = "Dandy"

DIRTY_NAME = 'dandy_dirty'
DIRTY_TYPE = 'DANDY_DIRTY'
DIRTY_TYPE_INPUT = (DIRTY_TYPE,)

JS_NAME = "js"
JS_TYPE = "DANDY_JS_URLS"
JS_TYPE_INPUT = (JS_TYPE,)

HTML_NAME = "html"
HTML_TYPE = "DANDY_HTML_URLS"
HTML_TYPE_INPUT = (HTML_TYPE,)

CSS_NAME = "css"
CSS_TYPE = "DANDY_CSS_URLS"
CSS_TYPE_INPUT = (CSS_TYPE,)

JSON_NAME = "json"
JSON_TYPE = "DANDY_JSON_URLS"
JSON_TYPE_INPUT = (JSON_TYPE,)

YAML_NAME = "yaml"
YAML_TYPE = "DANDY_YAML_URLS"
YAML_TYPE_INPUT = (YAML_TYPE,)

WASM_NAME = "wasm"
WASM_TYPE = "DANDY_WASM_URLS"
WASM_TYPE_INPUT = (WASM_TYPE,)

CAPTURE_NAME = "captures"
CAPTURE_TYPE = "DANDY_CAPTURE"
CAPTURE_TYPE_INPUT = (CAPTURE_TYPE,)

B64IMAGES_NAME = "b64images"
B64IMAGES_TYPE = "DANDY_B64IMAGES"
B64IMAGES_TYPE_INPUT = (B64IMAGES_TYPE,)

B64MASKS_NAME = "b64masks"
B64MASKS_TYPE = "DANDY_B64MASKS"
B64MASKS_TYPE_INPUT = (B64MASKS_TYPE,)

def batch(images):
  n = len(images)

  if n == 0:
  #   i can't get this right. workaround is always return an image from javascript
  #   return torch.zeros((1, 3, 512, 512), dtype=torch.uint8, device="cpu")[None,]
    return None
  
  if n == 1:
    print("TORCHY: " + str(images[0].shape))
    return images[0]
  
  max_height = max(image.shape[1] for image in images)
  max_width = max(image.shape[2] for image in images)

  resized_images = []
  for image in images:
    if image.shape[1:] != (max_height, max_width):
      resized_image = comfy.utils.common_upscale(image.movedim(-1, 1), max_width, max_height, "bilinear", "center").movedim(1, -1)
    else:
      resized_image = image
    resized_images.append(resized_image)

  batched_image = torch.cat(resized_images, dim=0)
  return batched_image

def make_b64image(image):
  p = 255. * image.cpu().numpy()
  q = Image.fromarray(np.clip(p, 0, 255).astype(np.uint8))
  buffered = BytesIO()
  q.save(buffered, format="PNG")
  img_base64 = base64.b64encode(buffered.getvalue())
  return f"data:image/png;base64,{img_base64.decode()}"

def make_image(filename):
  i = folder_paths.get_annotated_filepath(filename)
  i = Image.open(i)
  i = ImageOps.exif_transpose(i)
  i = i.convert("RGB")
  i = np.array(i).astype(np.float32) / 255.0
  i = torch.from_numpy(i)[None,]
  return i

def make_mask(filename):
  m = folder_paths.get_annotated_filepath(filename)
  m = Image.open(m)
  m = ImageOps.exif_transpose(m)

  if "A" in m.getbands():
      m = np.array(m.getchannel("A")).astype(np.float32) / 255.0
      m = torch.from_numpy(m)
  else:
      m = torch.zeros((64,64), dtype=torch.float32, device="cpu")

  return m 



class DandyJs:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        JS_NAME: JS_TYPE_INPUT,
      },
    }

  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)

  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, js):
    return (js,)
  


class DandyHtml:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        HTML_NAME: HTML_TYPE_INPUT
      },
    }
  
  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (HTML_TYPE,)
  RETURN_NAMES = (HTML_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, html):
    return (html,)



class DandyCss:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        CSS_NAME: CSS_TYPE_INPUT
      },
    }
  
  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (CSS_TYPE,)
  RETURN_NAMES = (CSS_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, css):
    return (css,)

  

class DandyJson:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        JSON_NAME: JSON_TYPE_INPUT
      },
    }
  
  
  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (JSON_TYPE,)
  RETURN_NAMES = (JSON_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, js):
    return (js,)



class DandyYaml:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        YAML_NAME: YAML_TYPE_INPUT
      },
    }
  
  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (YAML_TYPE,)
  RETURN_NAMES = (YAML_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, yaml):
    return (yaml,)



class DandyP5JsSetup:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        JS_NAME: JS_TYPE_INPUT
      },
    }
  
  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, js):
    return (js,)



class DandyP5JsDraw:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        JS_NAME: JS_TYPE_INPUT
      },
    }

  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE
  
  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, js):
    return (js, )



class DandyJsLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(s):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        JS_NAME: JS_TYPE_INPUT
      },
    }

  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE
  
  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, js):
    return (js,)



class DandyP5JsLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(s):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        JS_NAME: JS_TYPE_INPUT,
      },
    }

  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE
  
  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, js):
    return (js,)




class DandyHtmlLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        HTML_NAME: HTML_TYPE_INPUT
      },
    }
  
  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (HTML_TYPE,)
  RETURN_NAMES = (HTML_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, html):
    return (html,)



class DandyCssLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        CSS_NAME: CSS_TYPE_INPUT
      },
    }
  
  @classmethod
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (CSS_TYPE,)
  RETURN_NAMES = (CSS_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, css):
    return (css,)

  

class DandyJsonLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        JSON_NAME: JSON_TYPE_INPUT
      },
    }
  
  
  @classmethod
  def IS_CHANGED(self, json):
    return NEVER_CHANGE

  RETURN_TYPES = (JSON_TYPE,)
  RETURN_NAMES = (JSON_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, json):
    return (json,)



class DandyYamlLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        YAML_NAME: YAML_TYPE_INPUT
      },
    }
  
  @classmethod
  def IS_CHANGED(self, yaml):
    return NEVER_CHANGE

  RETURN_TYPES = (YAML_TYPE,)
  RETURN_NAMES = (YAML_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, yaml):
    return (yaml,)


class DandyWasmLoader:
  def __init__(self):
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        WASM_NAME: WASM_TYPE_INPUT
      },
    }
  
  @classmethod
  def IS_CHANGED(self, yaml):
    return NEVER_CHANGE

  RETURN_TYPES = (WASM_TYPE,)
  RETURN_NAMES = (WASM_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, wasm):
    return (wasm,)



class DandyB64Encoder:
  def __init__(self):
    self.i = 0
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        DIRTY_NAME: DIRTY_TYPE_INPUT,
        "images": ("IMAGE",),
        "masks": ("MASK",),
        B64IMAGES_NAME: B64IMAGES_TYPE_INPUT,
        B64MASKS_NAME: B64MASKS_TYPE_INPUT
      },
    }
  
  @classmethod
  def IS_CHANGED(self, dandy_dirty, images=None, masks=None, b64images=None, b64masks=None):
    if (dandy_dirty == True):
      self.i += 1
    return str(self.i).encode().hex()

  RETURN_TYPES = (B64IMAGES_TYPE, B64MASKS_TYPE)
  RETURN_NAMES = (B64IMAGES_NAME, B64MASKS_NAME)
  FUNCTION = "run"
  OUTPUT_NODE = True
  CATEGORY = DANDY_CATEGORY

  def run(self, dandy_dirty, images=None, masks=None, b64images=None, b64masks=None):
    b64images_out = list()
    b64masks_out = list()

    if images is not None:
      for image in images:
        b64images_out.append(make_b64image(image))

    if masks is not None:
      for mask in masks:
        b64masks_out.append(make_b64image(mask))

    print("HERE")
    return { "ui": { "b64images": b64images_out, "b64masks": b64masks_out }, 
             "result": (b64images_out, b64images_out) }



class DandyLand:
  def __init__(self):
    pass
  
  @classmethod
  def INPUT_TYPES(s):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        #"seed": ("SEED",),
        CAPTURE_NAME: CAPTURE_TYPE_INPUT,
        JS_NAME: JS_TYPE_INPUT,
        JSON_NAME: JSON_TYPE_INPUT,
        YAML_NAME: YAML_TYPE_INPUT,
        HTML_NAME: HTML_TYPE_INPUT,
        CSS_NAME: CSS_TYPE_INPUT,
        "width": WIDTH_HEIGHT_INPUT,
        "height": WIDTH_HEIGHT_INPUT,
        B64IMAGES_NAME: B64IMAGES_TYPE_INPUT,
        B64MASKS_NAME: B64MASKS_TYPE_INPUT,
      },
    }

  @classmethod
  def IS_CHANGED(self, captures, js=None, json=None, yaml=None, html=None,
                 css=None, width=None, height=None, b64images=None, b64masks=None):
    m = hashlib.sha256()
    for capture in captures.split("\n"):
      image_path = folder_paths.get_annotated_filepath(capture)
      with open(image_path, 'rb') as f:
        m.update(f.read())
    return m.digest().hex()
  
  RETURN_TYPES = ("IMAGE", "MASK")
  RETURN_NAMES = ("images", "masks")
  FUNCTION = "run"
  OUTPUT_NODE = True
  CATEGORY = DANDY_CATEGORY

  def run(self, captures, js=None, json=None, yaml=None, html=None,
          css=None, width=None, height=None, b64images=None, b64masks=None):
    print("DandyLand :: captures: " + str(captures) + " :: js: " + str(js))
    
    files = list(filter(lambda x: x.split(), captures.split("\n")))
    def f(g):
      return list(map(lambda x: g(x), files))

    print("DandyLand :: files: <" + str(files) + ">")

    output_images = f(make_image)
    #output_masks = f(make_mask)

    output_image = batch(output_images)
    #output_mask = batch(output_masks)
    output_mask = torch.zeros((512, 512), dtype=torch.float32, device="cpu")[None,]
    
    return (output_image, output_mask)

# Set the web directory, any .js file in that directory will be loaded by the frontend as a frontend extension
WEB_DIRECTORY = "web"

NODE_CLASS_MAPPINGS = {
  "DandyLand": DandyLand,
  "DandyJs": DandyJs,
  "DandyJson": DandyJson,
  "DandyYaml": DandyYaml,
  "DandyCss": DandyCss,
  "DandyHtml": DandyHtml,
  "DandyP5JsSetup": DandyP5JsSetup,
  "DandyP5JsDraw": DandyP5JsDraw,
  "DandyJsLoader": DandyJsLoader,
  "DandyP5JsLoader": DandyP5JsLoader,
  "DandyJsonLoader": DandyJsonLoader,
  "DandyYamlLoader": DandyYamlLoader,
  "DandyCssLoader": DandyCssLoader,
  "DandyHtmlLoader": DandyHtmlLoader,
  "DandyB64Encoder": DandyB64Encoder,
}

NODE_DISPLAY_NAME_MAPPINGS = {
  "DandyLand": "Dandy Land",
  "DandyB64Encoder": "Dandy B64 Encoder",
  "DandyJs": "Dandy Js",
  "DandyHtml": "Dandy Html",
  "DandyCss": "Dandy Css",
  "DandyJson": "Dandy Json",
  "DandyYaml": "Dandy Yaml",
  "DandyJsLoader": "Dandy Js Loader",
  "DandyJsonLoader": "Dandy Json Loader",
  "DandyYamlLoader": "Dandy Yaml Loader",
  "DandyCssLoader": "Dandy Css Loader",
  "DandyHtmlLoader": "Dandy Html Loader",
  "DandyP5JsLoader": "Dandy p5.js Loader",
  "DandyP5JsSetup": "Dandy p5.js Setup",
  "DandyP5JsDraw": "Dandy p5.js Draw",
}
