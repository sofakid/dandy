import torch
import base64
import folder_paths
from io import BytesIO
from PIL import Image, ImageOps
from PIL.PngImagePlugin import PngInfo
import numpy as np
import comfy.utils

from .constants import *
from .dandynodes import *

def batch_masks(masks):
  n = len(masks)

  if n == 0:
    return None, 0, 0

  masks_4d = []
  for mask in masks:
    shape_len = len(mask.shape)
    if shape_len == 2:
      m = mask.unsqueeze(0).unsqueeze(0)
    elif shape_len == 3:
      m = mask.unsqueeze(0)

    masks_4d.append(m)

  h = 2
  w = 3

  max_height = max(mask.shape[h] for mask in masks_4d)
  max_width = max(mask.shape[w] for mask in masks_4d)
  
  resized_masks = []
  for mask in masks_4d:
    if mask.shape[h] != max_height or mask.shape[w] != max_width:
      resized_mask = comfy.utils.common_upscale(mask, max_width, max_height, 'bilinear', 'center')
    else:
      resized_mask = mask
    
    resized_mask = resized_mask.squeeze(0)
    resized_masks.append(resized_mask)

  batched_mask = torch.cat(resized_masks, dim=0)
  return batched_mask, max_width, max_height

def batch_images(images):
  n = len(images)

  if n == 0:
    return None, 0, 0

  # Convert all images to 4D tensors if they are not already
  images = [torch.unsqueeze(image, dim=0) if len(image.shape) == 3 else image for image in images]
  h = 1
  w = 2

  max_height = max(image.shape[h] for image in images)
  max_width = max(image.shape[w] for image in images)
  
  resized_images = []
  for image in images:
    if image.shape[h] != max_height or image.shape[w] != max_width:
      resized_image = comfy.utils.common_upscale(image.movedim(-1, 1), max_width, max_height, 'bilinear', 'center').movedim(1, -1)
    else:
      resized_image = image
    
    resized_images.append(resized_image)

  batched_image = torch.cat(resized_images, dim=0)
  return batched_image, max_width, max_height

def make_b64mask(mask):
  shape_len = len(mask.shape)
  if shape_len == 3:
    mask = mask.squeeze(0)
  
  return make_b64image(mask)

def make_b64image(image):
  p = 255. * image.cpu().numpy()
  q = Image.fromarray(np.clip(p, 0, 255).astype(np.uint8))
  buffered = BytesIO()
  q.save(buffered, format='PNG')
  img_base64 = base64.b64encode(buffered.getvalue())
  return f'data:image/png;base64,{img_base64.decode()}'

def make_image_from_b64(b64_data_url):
  _, i = b64_data_url.split(',', 1)
  i = base64.b64decode(i)
  i = BytesIO(i)
  i = image_to_torch(i)
  return i

def make_mask_from_b64(b64_data_url):
  _, m = b64_data_url.split(',', 1)
  m = base64.b64decode(m)
  m = BytesIO(m)
  m = mask_to_torch(m)
  return m

def make_image_from_file(filename):
  i = folder_paths.get_annotated_filepath(filename)
  i = image_to_torch(i)
  return i

def make_mask_from_file(filename):
  m = folder_paths.get_annotated_filepath(filename)
  m = mask_to_torch(m)
  return m 

def image_to_torch(i):
  i = Image.open(i)
  i = ImageOps.exif_transpose(i)
  i = i.convert('RGB')
  i = np.array(i).astype(np.float32) / 255.0
  i = torch.from_numpy(i)[None,]
  return i

def mask_to_torch(m):
    m = Image.open(m)
    m = ImageOps.exif_transpose(m)
    m = m.convert('L') # make greyscale
    m = np.array(m).astype(np.float32) / 255.0
    return torch.from_numpy(m)