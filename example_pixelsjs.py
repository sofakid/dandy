from .constants import *
from .dandynodes import *
from .image import *
    
class DandyPixelsJs(DandyWithHashSocket):
  CATEGORY = DANDY_EXAMPLES_CATEGORY
  OUTPUT_NODE = True

  # do it this way instead of INPUT_TYPES
  # up the inheritance chain we add inputs for hash and service_id
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyRequiredInputs(super(), {
      IMAGE_NAME: IMAGE_TYPE_INPUT,
      'filter': (STRING_TYPE, { 'default': 'twenties' })
    })

  RETURN_TYPES = ('IMAGE',)
  RETURN_NAMES = ('image',)

  def run(self, service_id=None, image=None, filter=None, **kwargs):

    if service_id == None:
      print('DandyPixelsJs :: service_id is None')
      abort_abort_abort()
    print('DandyPixelsJs :: inputs: ' + str(kwargs))

    # turn tensors into b64 images to send to dandy
    b64images = []    
    if image != None:
      for x in image:
        b64 = make_b64image(x)
        b64images.append(b64)
    kwargs['image'] = b64images

    # this will stuff our filter into dandy.string 
    kwargs['string'] = filter

    # send the inputs to dandy, dandytown socket.on_sending_input will recive this
    o = self.client.send_input(service_id, kwargs)
    o = o['output']
    b64s = o['captures']
    def f(g):
      return list(map(lambda x: g(x), b64s))

    out_images = f(make_image_from_b64)
    out_images_batch, out_width, out_height = batch(out_images)
    
    return (out_images_batch,)
