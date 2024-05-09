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

# thank you WAS suite
def _check_mask_dimensions(self, tensors, names):
    dimensions = [tensor.shape[1:] for tensor in tensors]  # Exclude the batch dimension (if present)
    if len(set(dimensions)) > 1:
        mismatched_indices = [i for i, dim in enumerate(dimensions) if dim != dimensions[0]]
        mismatched_masks = [names[i] for i in mismatched_indices]
        raise ValueError(f"WAS Mask Batch Warning: Input mask dimensions do not match for masks: {mismatched_masks}")

# thank you WAS suite
def mask_batch(self, **kwargs):
    batched_tensors = [kwargs[key] for key in kwargs if kwargs[key] is not None]
    mask_names = [key for key in kwargs if kwargs[key] is not None]

    if not batched_tensors:
        raise ValueError("At least one input mask must be provided.")

    self._check_mask_dimensions(batched_tensors, mask_names)
    batched_tensors = torch.stack(batched_tensors, dim=0)
    batched_tensors = batched_tensors.unsqueeze(1)  # Add a channel dimension
    return (batched_tensors,)

def batch_masks(masks):
  n = len(masks)

  if n == 0:
    return None, 0, 0

  masks_4d = []
  for mask in masks:
    print("DandyBatch :: original: " + str(mask.shape))

    shape_len = len(mask.shape)
    if shape_len == 2:
      m = mask.unsqueeze(0).unsqueeze(0)
    elif shape_len == 3:
      m = mask.unsqueeze(0)

    masks_4d.append(m)
    print("DandyBatch :: reshaped: " + str(m.shape))

  h = 2
  w = 3

  max_height = max(mask.shape[h] for mask in masks_4d)
  max_width = max(mask.shape[w] for mask in masks_4d)
  
  resized_masks = []
  for mask in masks_4d:
    print("DandyBatch :: original: " + str(mask.shape))
    if mask.shape[h] != max_height or mask.shape[w] != max_width:
      resized_mask = comfy.utils.common_upscale(mask, max_width, max_height, 'bilinear', 'center')
    else:
      resized_mask = mask
    
    print("DandyBatch :: before squeezed: " + str(resized_mask.shape))
    resized_mask = resized_mask.squeeze(0)
    print("DandyBatch ::        squeezed: " + str(resized_mask.shape))
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
    print("DandyBatch :: original: " + str(image.shape))
    if image.shape[h] != max_height or image.shape[w] != max_width:
      resized_image = comfy.utils.common_upscale(image.movedim(-1, 1), max_width, max_height, 'bilinear', 'center').movedim(1, -1)
    else:
      resized_image = image
    
    print("DandyBatch :: resized: " + str(resized_image.shape))
    resized_images.append(resized_image)

  batched_image = torch.cat(resized_images, dim=0)
  return batched_image, max_width, max_height

def make_b64mask(mask):
  shape_len = len(mask.shape)
  print(f"shape A {mask.shape}")
  if shape_len == 3:
    mask = mask.squeeze(0)
  
  print(f"shape B {mask.shape}")
  # # mask = mask.reshape((-1, 1, mask.shape[-2], mask.shape[-1])).movedim(1, -1).expand(-1, -1, -1, 3)
  return make_b64image(mask)


def make_b64image(image):
  p = 255. * image.cpu().numpy()
  q = Image.fromarray(np.clip(p, 0, 255).astype(np.uint8))
  buffered = BytesIO()
  q.save(buffered, format='PNG')
  img_base64 = base64.b64encode(buffered.getvalue())
  return f'data:image/png;base64,{img_base64.decode()}'


def make_image_from_b64(b64_data_url):
  print("make_image_from_b64: " + str(b64_data_url)[:80])
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

# def mask_to_torch(m):
#   m = Image.open(m)
#   m = ImageOps.exif_transpose(m)

#   if 'A' in m.getbands():
#     m = np.array(m.getchannel('A')).astype(np.float32) / 255.0
#     m = torch.from_numpy(m)
#   else:
#     m = torch.zeros((64,64), dtype=torch.float32, device='cpu')
  
#   return m

def mask_to_torch(m):
    m = Image.open(m)
    m = ImageOps.exif_transpose(m)
    m = m.convert('L') # make greyscale
    m = np.array(m).astype(np.float32) / 255.0
    return torch.from_numpy(m)