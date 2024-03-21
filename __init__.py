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
  OUTPUT_NODE = True
  CATEGORY = "DandyLand"

  def IS_CHANGED(self):
    self.updateTick += 1
    return hex(self.updateTick)

  def run(self):
    collected_images = list()
    if images is not None:
      for image in images:
        i = 255. * image.cpu().numpy()
        img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8)) 
        collected_images.append(image_to_data_url(img))

    return { "ui": {"collected_images":collected_images} }

class DandyJsLoader:
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
      },
    }

  RETURN_TYPES = ()
  RETURN_NAMES = ()
  FUNCTION = "run"
  OUTPUT_NODE = True
  CATEGORY = "DandyLand"

  def IS_CHANGED(self, js=None):
    self.updateTick += 1
    return hex(self.updateTick)

  def run(self, js=None):
    pass

class DandyP5JsLoader:
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
      },
    }

  RETURN_TYPES = ()
  RETURN_NAMES = ()
  FUNCTION = "run"
  OUTPUT_NODE = True
  CATEGORY = "DandyLand"

  def IS_CHANGED(self):
    self.updateTick += 1
    return hex(self.updateTick)

  def run(self):
    # print("running p5js loader..")
    # print("js: " + str(js_in))
    # print("p5js: " + str(p5js))
    # return(str(js_in) + '\n' + str(p5js))
    pass


class DandyCanvas:
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

  RETURN_TYPES = ("IMAGE", "MASK",)
  RETURN_NAMES = ("Image", "Mask",)

  FUNCTION = "image_buffer"
  OUTPUT_NODE = True
  CATEGORY = "DandyLand"

  def image_buffer(self, js):
#        collected_images = list()
#        if images is not None:
#            for image in images:
#                i = 255. * image.cpu().numpy()
#                img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8)) 
#                collected_images.append(image_to_data_url(img))
#
#        print(f"Node {unique_id}: images: {images}")    
      image_path = folder_paths.get_annotated_filepath("canvas")
      i = Image.open(image_path)
      i = ImageOps.exif_transpose(i)

      rgb_image = i.convert("RGB")
      rgb_image = np.array(rgb_image).astype(np.float32) / 255.0
      rgb_image = torch.from_numpy(rgb_image)[None,]

      mask_path = folder_paths.get_annotated_filepath(mask)
      i = Image.open(mask_path)
      i = ImageOps.exif_transpose(i)

      if "A" in i.getbands():
          mask_data = np.array(i.getchannel("A")).astype(np.float32) / 255.0
          mask_data = torch.from_numpy(mask_data)
      else:
          mask_data = torch.zeros((64,64), dtype=torch.float32, device="cpu")

      return (rgb_image, mask_data, js) 

# Set the web directory, any .js file in that directory will be loaded by the frontend as a frontend extension
WEB_DIRECTORY = "web"

NODE_CLASS_MAPPINGS = {
  "DandyEditor": DandyEditor,
  "DandyCanvas": DandyCanvas,
  "DandyJsLoader": DandyJsLoader,
  "DandyP5JsLoader": DandyP5JsLoader
}

NODE_DISPLAY_NAME_MAPPINGS = {
  "DandyEditor": "Dandy Editor",
  "DandyCanvas": "Dandy Canvas",
  "DandyJsLoader": "Dandy Js Loader",
  "DandyP5JsLoader": "Dandy p5.js Loader"
}
