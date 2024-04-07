from .client import DandyServicesClient
from .constants import *

class DandyPrompt:
  def __init__(self):
    self.client = DandyServicesClient()
    pass

  @classmethod
  def INPUT_TYPES(self):
    return {
       "required": {
          "clip": ("CLIP",)
        },
        "optional": {
          HASH_NAME: HASH_TYPE_INPUT,
          SERVICE_ID_NAME: SERVICE_ID_TYPE_INPUT,
          DANDY_PROMPT_NAME: DANDY_PROMPT_TYPE_INPUT,
          STRING_NAME: STRING_TYPE_INPUT, 
        }
      }

  @classmethod
  def IS_CHANGED(self, hash, dandy_prompt, clip, string):
    return f'{hash}'.encode().hex()

  RETURN_TYPES = ('CONDITIONING','STRING')
  RETURN_NAMES = ('conditioning','string')

  FUNCTION = 'run'
  OUTPUT_NODE = False
  CATEGORY = DANDY_CATEGORY

  def run(self, clip, hash=None, service_id=None, dandy_prompt=None, string=None):
    prompt = self.client.request_string(service_id)
    tokens = clip.tokenize(prompt)
    cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
    return ([[cond, {"pooled_output": pooled}]], string)
