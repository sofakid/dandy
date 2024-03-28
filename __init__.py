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
WIDTH_HEIGHT_INPUT = ("INT", {"default": 512, "min": 0, "max": MAX_RESOLUTION, "step": 128})
NEVER_CHANGE = "never change".encode().hex()
DANDY_CATEGORY = "Dandy"

JS_NAME = "js"
JS_TYPE = "JS_URLS"
JS_TYPE_INPUT = (JS_TYPE,)

HTML_NAME = "html"
HTML_TYPE = "HTML_URLS"
HTML_TYPE_INPUT = (HTML_TYPE,)

CSS_NAME = "css"
CSS_TYPE = "CSS_URLS"
CSS_TYPE_INPUT = (CSS_TYPE,)

JSON_NAME = "json"
JSON_TYPE = "JSON_URLS"
JSON_TYPE_INPUT = (JSON_TYPE,)

YAML_NAME = "yaml"
YAML_TYPE = "YAML_URLS"
YAML_TYPE_INPUT = (YAML_TYPE,)

CAPTURE_NAME = "captures"
CAPTURE_TYPE = "DANDY_CAPTURE"
CAPTURE_TYPE_INPUT = (CAPTURE_TYPE,)

def batch(images):
  if len(images) > 1:
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

  return images[0]

def image_to_data_url(image):
  buffered = BytesIO()
  image.save(buffered, format="PNG")
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

def collect_images(images):
  collected_images = list()
  if images is not None:
    for image in images:
      i = 255. * image.cpu().numpy()
      img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8)) 
      collected_images.append(image_to_data_url(img))

  return { "ui": {"collected_images":collected_images} }

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
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (JSON_TYPE,)
  RETURN_NAMES = (JSON_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, js):
    return (js,)



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
  def IS_CHANGED(self, js):
    return NEVER_CHANGE

  RETURN_TYPES = (YAML_TYPE,)
  RETURN_NAMES = (YAML_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, yaml):
    return (yaml,)



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
        "images": ("IMAGE",),
        "masks": ("MASK",)
      },
    }

  @classmethod
  def IS_CHANGED(s, captures, js, json, yaml, html, css, width, height, images, masks):
      m = hashlib.sha256()
      for capture in captures.split("\n"):
        image_path = folder_paths.get_annotated_filepath(capture)
        with open(image_path, 'rb') as f:
          m.update(f.read())
      return m.digest().hex()
  
  RETURN_TYPES = ("IMAGE", "MASK", JS_TYPE,)
  RETURN_NAMES = ("images", "masks", JS_NAME,)
  FUNCTION = "run"
  OUTPUT_NODE = True
  CATEGORY = DANDY_CATEGORY

  def run(self, captures, js, json, yaml, html, css, width, height, images=None, masks=None):
    print("DandyLand :: captures: " + str(captures) + " :: js: " + str(js))
    
    files = list(filter(lambda x: x.split(), captures.split("\n")))
    def f(g):
      return list(map(lambda x: g(x), files))

    print("DandyLand :: files: <" + str(files) + ">")

    output_images = f(make_image)
    output_masks = f(make_mask)

    output_image = batch(output_images)
    output_mask = batch(output_masks)
    
    return (output_image, output_mask, js)

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
  "DandyHtmlLoader": DandyHtmlLoader
}

NODE_DISPLAY_NAME_MAPPINGS = {
  "DandyLand": "Dandy Land",
  "DandyJs": "Dandy Js",
  "DandyHtml": "Dandy Html",
  "DandyCss": "Dandy Css",
  "DandyJson": "Dandy Json",
  "DandyYaml": "Dandy Yaml",
  "DandyJsLoader": "Dandy Js Loader",
  "DandyP5JsLoader": "Dandy p5.js Loader",
  "DandyJsonLoader": "Dandy Json Loader",
  "DandyYamlLoader": "Dandy Yaml Loader",
  "DandyCssLoader": "Dandy Css Loader",
  "DandyHtmlLoader": "Dandy Html Loader",
  "DandyP5JsSetup": "Dandy p5.js Setup",
  "DandyP5JsDraw": "Dandy p5.js Draw"
}
