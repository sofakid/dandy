from .common import *
from .dandynodes import *
from .image import *
    
class DandyPixiJs(DandyWithHashSocket):
  CATEGORY = DANDY_EXAMPLES_CATEGORY
  OUTPUT_NODE = True

  # do it this way instead of INPUT_TYPES
  # up the inheritance chain we add inputs for hash and service_id
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), {
      'image': IMAGE_TYPE_INPUT,
    })

  RETURN_TYPES = ('IMAGE',)
  RETURN_NAMES = ('image',)

  def run(self, service_id=None, image=None, **kwargs):

    if service_id == None:
      print('DandyPixiJs :: service_id is None')
      abort_abort_abort()

    # turn tensors into b64 images to send to dandy
    b64images = []    
    if image != None:
      for x in image:
        b64 = make_b64image(x)
        b64images.append(b64)
    kwargs['image'] = b64images

    _, width, height = batch_images(image)
    kwargs['width'] = width
    kwargs['height'] = height

    # send the inputs to dandy, dandytown socket.on_sending_input will receive this
    o = self.client.send_input(service_id, kwargs)
    o = o['output']
    b64s = o['captures']
    def f(g):
      return list(map(lambda x: g(x), b64s))

    out_images = f(make_image_from_b64)
    out_images_batch, out_width, out_height = batch_images(out_images)
    
    return (out_images_batch,)
