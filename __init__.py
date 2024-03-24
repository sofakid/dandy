import torch
import base64
import folder_paths
from io import BytesIO
from PIL import Image, ImageOps
from PIL.PngImagePlugin import PngInfo
import numpy as np

JS_NAME = "js"
JS_TYPE = "JS_URLS"
JS_TYPE_INPUT = (JS_TYPE,)

CAPTURE_NAME = "capture"
CAPTURE_TYPE = "DANDY_CAPTURE"
CAPTURE_TYPE_INPUT = (CAPTURE_TYPE,)

def image_to_data_url(image):
  buffered = BytesIO()
  image.save(buffered, format="PNG")
  img_base64 = base64.b64encode(buffered.getvalue())
  return f"data:image/png;base64,{img_base64.decode()}"

def make_rgb(filename):
  image_path = folder_paths.get_annotated_filepath(filename)
  image = Image.open(image_path)
  image_t = ImageOps.exif_transpose(image)

  rgb_image = image_t.convert("RGB")
  rgb_image_np = np.array(rgb_image).astype(np.float32) / 255.0
  rgb_image_torch = torch.from_numpy(rgb_image_np)[None,]

  return rgb_image_torch

def make_mask(filename):
  mask_path = folder_paths.get_annotated_filepath(filename)
  mask_image = Image.open(mask_path)
  mask_image_t = ImageOps.exif_transpose(mask_image)

  if "A" in mask_image_t.getbands():
      mask_data = np.array(mask_image_t.getchannel("A")).astype(np.float32) / 255.0
      mask_data_torch = torch.from_numpy(mask_data)
  else:
      mask_data_torch = torch.zeros((64,64), dtype=torch.float32, device="cpu")

  return mask_data_torch 

def collect_images(images):
  collected_images = list()
  if images is not None:
    for image in images:
      i = 255. * image.cpu().numpy()
      img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8)) 
      collected_images.append(image_to_data_url(img))

  return { "ui": {"collected_images":collected_images} }

class DandyEditor:
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

  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)

  FUNCTION = "onExecute"
  OUTPUT_NODE = False
  CATEGORY = "DandyLand"

  def onExecute(self, js):
    return (js,)
  

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

  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  FUNCTION = "onExecute"
  OUTPUT_NODE = False
  CATEGORY = "DandyLand"

  def onExecute(self, js):
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

  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  FUNCTION = "onExecute"
  OUTPUT_NODE = False
  CATEGORY = "DandyLand"

  def onExecute(self, js):
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

  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  FUNCTION = "onExecute"
  OUTPUT_NODE = False
  CATEGORY = "DandyLand"

  def onExecute(self, js):
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
        JS_NAME: JS_TYPE_INPUT
      },
    }

  RETURN_TYPES = (JS_TYPE,)
  RETURN_NAMES = (JS_NAME,)
  FUNCTION = "onExecute"
  OUTPUT_NODE = False
  CATEGORY = "DandyLand"

  def onExecute(self, js):
    return (js,)

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
        JS_NAME: JS_TYPE_INPUT
      },
    }

  RETURN_TYPES = ("IMAGE", "MASK", JS_TYPE,)
  RETURN_NAMES = ("Image", "Mask", JS_NAME,)
  FUNCTION = "onExecute"
  OUTPUT_NODE = True
  CATEGORY = "DandyLand"

  def onExecute(self, seed, capture, js):
    print("DandyLand :: capture: " + str(capture) + " :: js: " + str(js))
    rgb_image = make_rgb(capture)
    mask = make_mask(capture)
    return (rgb_image, mask, js)

# Set the web directory, any .js file in that directory will be loaded by the frontend as a frontend extension
WEB_DIRECTORY = "web"

NODE_CLASS_MAPPINGS = {
  "DandyLand": DandyLand,
  "DandyEditor": DandyEditor,
  "DandyP5JsSetup": DandyP5JsSetup,
  "DandyP5JsDraw": DandyP5JsDraw,
  "DandyJsLoader": DandyJsLoader,
  "DandyP5JsLoader": DandyP5JsLoader
}

NODE_DISPLAY_NAME_MAPPINGS = {
  "DandyLand": "Dandy Land",
  "DandyEditor": "Dandy Editor",
  "DandyP5JsSetup": "Dandy p5.js Setup",
  "DandyP5JsDraw": "Dandy p5.js Draw",
  "DandyJsLoader": "Dandy Js Loader",
  "DandyP5JsLoader": "Dandy p5.js Loader"
}
