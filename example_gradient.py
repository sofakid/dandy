from .constants import *
from .dandynodes import *
from .image import *
    
class DandyGradient(DandyWithHashSocket):
  CATEGORY = DANDY_EXAMPLES_CATEGORY
  OUTPUT_NODE = True

  # do it this way instead of INPUT_TYPES
  # up the inheritance chain we add inputs for hash and service_id
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyOptionalInputs(super(), {
      'width': WIDTH_HEIGHT_INPUT,
      'height': WIDTH_HEIGHT_INPUT,
    })

  RETURN_TYPES = ('IMAGE',)
  RETURN_NAMES = ('image',)

  def run(self, service_id=None, **kwargs):

    if service_id == None:
      print('DandyPixiJs :: service_id is None')
      abort_abort_abort()

    # send the inputs to dandy, dandytown socket.on_sending_input will recive this
    o = self.client.send_input(service_id, kwargs)
    o = o['output']
    b64s = o['captures']
    b64 = b64s[0]

    out_image = make_image_from_b64(b64)
    
    return (out_image,)
