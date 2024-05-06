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

def batch(images):
  n = len(images)


  if n == 0:
    return None, 0, 0

  print(f"BATCHING :: {n} images :: images[0].shape: {images[0].shape}")
  shape_len = len(images[0].shape)

  if shape_len == 4: # shape [1, 512, 512, 3] (images)
    h = 1
    w = 2
  
  elif shape_len == 3: # shape [512, 512, 3] (images)
    h = 0
    w = 1
  
  elif shape_len == 2: # shape [512, 512] (masks)
    h = 0
    w = 1

  else:
    print("DandyBatch :: Unrecognised image shape: " + str(images[0].shape))
    return None, None, None

  max_height = max(image.shape[h] for image in images)
  max_width = max(image.shape[w] for image in images)
  
  # if n == 1:
  #   return images[0], max_width, max_height
  
  resized_images = []
  for image in images:
    print("DandyBatch :: original: " + str(image.shape))
    if image.shape[h] != max_height or image.shape[w] != max_width:
      if shape_len == 4:
          resized_image = comfy.utils.common_upscale(image.movedim(-1, 1), max_width, max_height, 'bilinear', 'center').movedim(1, -1)
      elif shape_len == 3:
          resized_image = comfy.utils.common_upscale(torch.unsqueeze(image, dim=0).movedim(-1, 1), max_width, max_height, 'bilinear', 'center').movedim(1, -1)
      else:
          image = image.unsqueeze(0)
          image = image.unsqueeze(0)
          resized_image = comfy.utils.common_upscale(image, max_width, max_height, 'bilinear', 'center')
          resized_image = resized_image.squeeze(0)
          resized_image = resized_image.squeeze(0)
    else:
      if shape_len == 3:
        resized_image = torch.unsqueeze(image, dim=0)
      else:
        resized_image = image
    
    print("DandyBatch :: resized: " + str(resized_image.shape))
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

def make_b64mask(mask):
  mask = mask.reshape((-1, 1, mask.shape[-2], mask.shape[-1])).movedim(1, -1).expand(-1, -1, -1, 3)
  make_b64image(mask)

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

  if 'A' in m.getbands():
    m = np.array(m.getchannel('A')).astype(np.float32) / 255.0
    m = torch.from_numpy(m)
  else:
    m = torch.zeros((64,64), dtype=torch.float32, device='cpu')
  
  return m
