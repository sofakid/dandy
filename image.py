import torch
import base64
import folder_paths
from io import BytesIO
from PIL import Image, ImageOps
from PIL.PngImagePlugin import PngInfo
import numpy as np
import comfy.utils

from .constants import *

# def batch(images):
#   n = len(images)

#   if n == 0:
#     return None
  
#   if n == 1:
#     return images[0]
  
#   max_height = max(image.shape[1] for image in images)
#   max_width = max(image.shape[2] for image in images)

#   resized_images = []
#   for image in images:
#     if image.shape[1:] != (max_height, max_width):
#       resized_image = comfy.utils.common_upscale(image.movedim(-1, 1), max_width, max_height, 'bilinear', 'center').movedim(1, -1)
#     else:
#       resized_image = image
#     resized_images.append(resized_image)

#   batched_image = torch.cat(resized_images, dim=0)
#   return batched_image

def batch(images):
  n = len(images)

  if n == 0:
    return None, 0, 0

  is_image = False
  if len(images[0].shape) == 4: # shape [1, 512, 512, 3]
    is_image = True
    h = 1
    w = 2
  
  elif len(images[0].shape) == 2: # shape [512, 512]
    is_image = False
    h = 0
    w = 1

  else:
    print("DandyBatch :: Unrecognised image shape: " + str(images[0].shape))
    return None, None, None

  max_height = max(image.shape[h] for image in images)
  max_width = max(image.shape[w] for image in images)
  
  if n == 1:
    return images[0], max_width, max_height
  
  resized_images = []
  for image in images:
    if is_image:
      if image.shape[1:3] != (max_height, max_width):
        resized_image = comfy.utils.common_upscale(image.movedim(-1, 1), max_width, max_height, 'bilinear', 'center').movedim(1, -1)
      else:
        resized_image = image
    else:
      if image.shape != (max_height, max_width):
        resized_image = comfy.utils.common_upscale(image, max_width, max_height, 'bilinear', 'center')
      else:
        resized_image = image
    resized_images.append(resized_image)

  batched_image = torch.cat(resized_images, dim=0)
  return batched_image, max_width, max_height

def make_b64image(image):
  p = 255. * image.cpu().numpy()
  q = Image.fromarray(np.clip(p, 0, 255).astype(np.uint8))
  buffered = BytesIO()
  q.save(buffered, format='PNG')
  img_base64 = base64.b64encode(buffered.getvalue())
  return f'data:image/png;base64,{img_base64.decode()}'

def make_image_from_b64(b64_data_url):
  _, base64_data = b64_data_url.split(',', 1)
  binary_data = base64.b64decode(base64_data)
  i = Image.open(BytesIO(binary_data))
  i = ImageOps.exif_transpose(i)
  i = i.convert('RGB')
  i = np.array(i).astype(np.float32) / 255.0
  i = torch.from_numpy(i)[None,]
  return i

def make_mask_from_b64(b64_data_url):
  _, base64_data = b64_data_url.split(',', 1)
  binary_data = base64.b64decode(base64_data)
  m = Image.open(BytesIO(binary_data))
  m = ImageOps.exif_transpose(m)
    
  if 'A' in m.getbands():
    m = np.array(m.getchannel('A')).astype(np.float32) / 255.0
    print("Alpha bands: " + str(m))
    m = torch.from_numpy(m)
  else:
    print("No alpha bands")
    m = torch.zeros((64,64), dtype=torch.float32, device='cpu')
  return m

def make_image_from_file(filename):
  i = folder_paths.get_annotated_filepath(filename)
  i = Image.open(i)
  i = ImageOps.exif_transpose(i)
  i = i.convert('RGB')
  i = np.array(i).astype(np.float32) / 255.0
  i = torch.from_numpy(i)[None,]
  return i

def make_mask_from_file(filename):
  m = folder_paths.get_annotated_filepath(filename)
  m = Image.open(m)
  m = ImageOps.exif_transpose(m)

  if 'A' in m.getbands():
    m = np.array(m.getchannel('A')).astype(np.float32) / 255.0
    m = torch.from_numpy(m)
  else:
    m = torch.zeros((64,64), dtype=torch.float32, device='cpu')

  return m 


class DandyB64Encoder:
  def __init__(self):
    self.i = 0
    pass

  @classmethod
  def INPUT_TYPES(self):
    return DandyWidgets({
      DIRTY_NAME: DIRTY_TYPE_INPUT,
      'images': ('IMAGE',),
      'masks': ('MASK',),
      IMAGE_URL_NAME: IMAGE_URL_TYPE_INPUT,
    })
  
  @classmethod
  def IS_CHANGED(self, dandy_dirty, images=None, masks=None, image_url=None):
    if (dandy_dirty == True):
      self.i += 1
    return str(self.i).encode().hex()

  RETURN_TYPES = (IMAGE_URL_TYPE,)
  RETURN_NAMES = (IMAGE_URL_NAME,)
  FUNCTION = 'run'
  OUTPUT_NODE = True
  CATEGORY = DANDY_CATEGORY

  def run(self, dandy_dirty, images=None, masks=None, image_url=None):
    image_url_out = list()
    b64masks_out = list()

    if images is not None:
      for image in images:
        image_url_out.append(make_b64image(image))

    if masks is not None:
      for mask in masks:
        image_url_out.append(make_b64image(mask))

    return { 'ui': { 'image_url': image_url_out }, 
             'result': (image_url_out, image_url_out) }


