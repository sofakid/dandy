from .constants import *
from .dandynodes import *
from .client import DandyServicesClient
from .image import *
    
def serialize_with_tensors(o):
  if isinstance(o, torch.Tensor):
    return { 'tensor': o.tolist() }
  if isinstance(o, dict):
    return {key: serialize_with_tensors(value) for key, value in o.items()}
  if isinstance(o, list):
    return [serialize_with_tensors(item) for item in o]
  return o
    
def deserialize_with_tensors(o):
  if isinstance(o, dict) and 'tensor' in o:
    return torch.tensor(o['tensor'])
  if isinstance(o, dict):
    return {key: deserialize_with_tensors(value) for key, value in o.items()}
  if isinstance(o, list):
    return [deserialize_with_tensors(item) for item in o]
  return o

class DandyLand(DandyWithHashSocket):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), {
      'image': ('IMAGE',),
      'mask': ('MASK',),
      'positive':('CONDITIONING',),
      'negative':('CONDITIONING',),
      'int': ('INT', { 'display': 'number', "default": 0 }),
      'float': ('FLOAT', { 'display': 'number', "default": 0.0 }),
      'boolean': ('BOOLEAN', { 'default': False }),
      'width': WIDTH_HEIGHT_INPUT,
      'height': WIDTH_HEIGHT_INPUT,
    })

  RETURN_TYPES = ('IMAGE', 'MASK', 'CONDITIONING', 'CONDITIONING', 'INT', 'FLOAT', 'BOOLEAN', 'INT',   'INT'   , 'STRING')
  RETURN_NAMES = ('image', 'mask', 'positive',     'negative',     'int', 'float', 'boolean', 'width', 'height', 'string')

  def run(self, service_id=None, 
          image=None, mask=None, 
          positive=None, negative=None, 
          int=None, float=None, boolean=False, string=None, 
          **kwargs):

    if service_id == None:
      print('DandyLand :: service_id is None')
      abort_abort_abort()

    b64images = []    
    if image != None:
      for x in image:
        b64 = make_b64image(x)
        b64images.append(b64)

    b64masks = []
    if mask != None:
      for x in mask:
        b64 = make_b64image(x)
        b64masks.append(b64)

    ser_positive = []
    if positive != None:
      ser_positive = serialize_with_tensors(positive)

    ser_negative = []
    if negative != None:
      ser_negative = serialize_with_tensors(negative)
    
    if int is None:
      int = 0

    if float is None:
      float = 0

    if boolean is None:
      boolean = False  
    
    if string is None:
      string = ''
    
    kwargs['captures'] = 'deleted'
    kwargs['positive'] = 'deleted'
    kwargs['negative'] = 'deleted'
    print("DandyLand :: run :: kwargs: " + str(kwargs))

    o = self.client.request_captures(service_id,
                                     int, float, boolean, string, 
                                     ser_positive, ser_negative, b64images, b64masks)

    b64s = o['captures']
    def f(g):
      return list(map(lambda x: g(x), b64s))

    out_images = f(make_image_from_b64)
    out_masks = f(make_mask_from_b64)

    out_images_batch, out_width, out_height = batch(out_images)
    out_masks_batch, mask_width, mask_height = batch(out_masks)
    
    out_int = o['int']
    out_float = o['float']
    out_boolean = o['boolean']
    out_string = o['string']
    
    ser_positive = o['positive']
    out_positive = deserialize_with_tensors(ser_positive)
    
    ser_negative = o['negative']
    out_negative = deserialize_with_tensors(ser_negative)
    
    o['captures'] = 'deleted'
    o['positive'] = 'deleted'
    o['negative'] = 'deleted'
    print("DandyLand :: run :: o: " + str(o))

    print(f'DandyLand :: width: {out_width}, height: {out_height}, string: <{out_string}>')
    return (out_images_batch, out_masks_batch, out_positive, out_negative,
            out_int, out_float, out_boolean, out_width, out_height, out_string)
