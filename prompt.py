from .common import *
from .dandynodes import *

class DandyPrompt(DandyWithHashSocket):
  @classmethod
  def DANDY_INPUTS(cls):
    return DandyRequiredInputs(super(), {
      "clip": ("CLIP",)
    })

  RETURN_TYPES = ('CONDITIONING', 'STRING')
  RETURN_NAMES = ('conditioning', 'string')

  def run(self, clip=None, service_id=None, **kwargs):
    o = self.client.send_input(service_id, kwargs)
    prompt = o['output']['prompt']
    tokens = clip.tokenize(prompt)
    cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
    return ([[cond, { "pooled_output": pooled }]], prompt)
