import torch
import base64
import folder_paths
from io import BytesIO
from PIL import Image, ImageOps
from PIL.PngImagePlugin import PngInfo
import numpy as np
import comfy.utils

from .constants import *

def batch(images):
  n = len(images)

  if n == 0:
    return None
  
  if n == 1:
    return images[0]
  
  max_height = max(image.shape[1] for image in images)
  max_width = max(image.shape[2] for image in images)

  resized_images = []
  for image in images:
    if image.shape[1:] != (max_height, max_width):
      resized_image = comfy.utils.common_upscale(image.movedim(-1, 1), max_width, max_height, 'bilinear', 'center').movedim(1, -1)
    else:
      resized_image = image
    resized_images.append(resized_image)

  batched_image = torch.cat(resized_images, dim=0)
  return batched_image

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
    m = torch.from_numpy(m)
  else:
    m = torch.zeros((64,64), dtype=torch.float32, device='cpu')

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
      B64IMAGES_NAME: B64IMAGES_TYPE_INPUT,
      B64MASKS_NAME: B64MASKS_TYPE_INPUT
    })
  
  @classmethod
  def IS_CHANGED(self, dandy_dirty, images=None, masks=None, b64images=None, b64masks=None):
    if (dandy_dirty == True):
      self.i += 1
    return str(self.i).encode().hex()

  RETURN_TYPES = (B64IMAGES_TYPE, B64MASKS_TYPE)
  RETURN_NAMES = (B64IMAGES_NAME, B64MASKS_NAME)
  FUNCTION = 'run'
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

    print('HERE')
    return { 'ui': { 'b64images': b64images_out, 'b64masks': b64masks_out }, 
             'result': (b64images_out, b64images_out) }


