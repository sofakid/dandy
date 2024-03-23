import torch
import base64
import folder_paths
from io import BytesIO
from PIL import Image, ImageOps
from PIL.PngImagePlugin import PngInfo
import numpy as np

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

class DandyEditor:
  def __init__(self):
    self.updateTick = 1
    pass

  @classmethod
  def INPUT_TYPES(s):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        "seed": ("SEED", 0),
      },
    }

  RETURN_TYPES = ()
  RETURN_NAMES = ()

  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = "DandyLand"

  def run(self):
    collected_images = list()
    if images is not None:
      for image in images:
        i = 255. * image.cpu().numpy()
        img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8)) 
        collected_images.append(image_to_data_url(img))

    return { "ui": {"collected_images":collected_images} }

class DandyP5JsSetup:
  def __init__(self):
    self.updateTick = 1
    pass

  @classmethod
  def INPUT_TYPES(s):
    return {
      "required": {
      }, 
      "hidden": {
      },
      "optional": {
        "seed": ("SEED", 0),
      },
    }

  RETURN_TYPES = ()
  RETURN_NAMES = ()
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = "DandyLand"

  def run(self):
    pass


class DandyP5JsDraw:
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
        "seed": ("SEED", 0),
      },
    }

  RETURN_TYPES = ()
  RETURN_NAMES = ()
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = "DandyLand"

  def run(self):
    pass


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
      },
    }

  RETURN_TYPES = ()
  RETURN_NAMES = ()
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = "DandyLand"

  def IS_CHANGED(self, js=None):
    self.updateTick += 1
    return hex(self.updateTick)

  def run(self, js=None):
    pass

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
      },
    }

  RETURN_TYPES = ()
  RETURN_NAMES = ()
  FUNCTION = "run"
  OUTPUT_NODE = False
  CATEGORY = "DandyLand"

  def run(self):
    pass

class DandyLand:
  def __init__(self):
    pass
  
  @classmethod
  def INPUT_TYPES(s):
    return {
      "required": {
        "capture": ("DANDYCAPTURE", "")
      }, 
      "hidden": {
      },
      "optional": {
      },
    }

  RETURN_TYPES = ("IMAGE", "MASK",)
  RETURN_NAMES = ("Image", "Mask",)

  FUNCTION = "run"
  OUTPUT_NODE = True
  CATEGORY = "DandyLand"

  def run(self, capture):
    rgb_image = make_rgb(capture)
    mask = make_mask(capture)
    return (rgb_image, mask) 

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
