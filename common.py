
MAX_DANDY_SOCKET_MSG = 2000*1024*1024 # two gigabytes
DANDY_WS_PORT = 7872
MAX_RESOLUTION = 12800
NEVER_CHANGE = 'never change'.encode().hex()

DANDY_CATEGORY = 'Dandy'
DANDY_EXAMPLES_CATEGORY = 'Dandy Examples'
DANDY_COLLECTORS_CATEGORY = 'Dandy Collectors'
DANDY_SPLITTERS_CATEGORY = 'Dandy Splitters'
DANDY_LOADERS_CATEGORY = 'Dandy Loaders'
DANDY_PREVIEWS_CATEGORY = 'Dandy Previews'

DANDY_CHILD_PROCESS = '--DANDY_CHILD_PROCESS'

WIDTH_HEIGHT_INPUT = ('INT', {'default': 512, 'min': 10, 'max': MAX_RESOLUTION, 'step': 128})
N_INPUTS_INPUT = ('INT', {'default': 2, 'min': 1, 'max': MAX_RESOLUTION, 'step': 1})
N_OUTPUTS_INPUT = ('INT', {'default': 2, 'min': 1, 'max': MAX_RESOLUTION, 'step': 1})

HASH_NAME = 'hash'
HASH_TYPE = 'DANDY_HASH'
HASH_TYPE_INPUT = (HASH_TYPE,)

SERVICE_ID_NAME = 'service_id'
SERVICE_ID_TYPE = 'DANDY_SERVICE_ID'
SERVICE_ID_TYPE_INPUT = (SERVICE_ID_TYPE,)

DIRTY_NAME = 'dandy_dirty'
DIRTY_TYPE = 'DANDY_DIRTY'
DIRTY_TYPE_INPUT = (DIRTY_TYPE,)

URL_NAME = 'url'
URL_TYPE = 'DANDY_URLS'
URL_TYPE_INPUT = (URL_TYPE,)

JS_NAME = 'js'
JS_TYPE = 'DANDY_JS_URLS'
JS_TYPE_INPUT = (JS_TYPE,)

HTML_NAME = 'html'
HTML_TYPE = 'DANDY_HTML_URLS'
HTML_TYPE_INPUT = (HTML_TYPE,)

CSS_NAME = 'css'
CSS_TYPE = 'DANDY_CSS_URLS'
CSS_TYPE_INPUT = (CSS_TYPE,)

JSON_NAME = 'json'
JSON_TYPE = 'DANDY_JSON_URLS'
JSON_TYPE_INPUT = (JSON_TYPE,)

YAML_NAME = 'yaml'
YAML_TYPE = 'DANDY_YAML_URLS'
YAML_TYPE_INPUT = (YAML_TYPE,)

WASM_NAME = 'wasm'
WASM_TYPE = 'DANDY_WASM_URLS'
WASM_TYPE_INPUT = (WASM_TYPE,)

DANDY_PROMPT_NAME = 'dandy_prompt'
DANDY_PROMPT_TYPE = 'DANDY_PROMPT'
DANDY_PROMPT_TYPE_INPUT = (DANDY_PROMPT_TYPE,)

IMAGE_URL_NAME = 'image_url'
IMAGE_URL_TYPE = 'DANDY_IMAGE_URL'
IMAGE_URL_TYPE_INPUT = (IMAGE_URL_TYPE,)

INT_NAME = 'int'
INT_TYPE = 'INT'
INT_TYPE_INPUT = (INT_TYPE, { 'default': 0 })

FLOAT_NAME = 'float'
FLOAT_TYPE = 'FLOAT'
FLOAT_TYPE_INPUT = (FLOAT_TYPE, { 'default': '' })

BOOLEAN_NAME = 'boolean'
BOOLEAN_TYPE = 'BOOLEAN'
BOOLEAN_TYPE_INPUT = (BOOLEAN_TYPE, { 'default': '' })

STRING_NAME = 'string'
STRING_TYPE = 'STRING'
STRING_TYPE_INPUT = (STRING_TYPE, { 'default': '' })

IMAGE_NAME = 'image'
IMAGE_TYPE = 'IMAGE'
IMAGE_TYPE_INPUT = (IMAGE_TYPE,)

MASK_NAME = 'mask'
MASK_TYPE = 'MASK'
MASK_TYPE_INPUT = (MASK_TYPE,)


def ui_and_result(*args):
  return { 'ui': { 'value': list(args)}, 'result': list(args) }

def abort_abort_abort():
  print('abort abort abort')
  import comfy.model_management
  raise comfy.model_management.InterruptProcessingException

def dandy_is_child():
  import sys
  return DANDY_CHILD_PROCESS in sys.argv

def dandy_flatten(lst):
  if not isinstance(lst, list):
    print("buh --------------")
    return lst
  print('ooo ------------')
  flattened = []
  for x in lst:
    if isinstance(x, list):
      flattened.extend(dandy_flatten(x))
    else:
      flattened.append(x)
  return flattened