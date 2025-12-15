import { DandyTown, DandyJsModuleData, DandyJsClassicData } from "/extensions/dandy/dandytown.js"

const default_filter = 'twenties'
const filters = [
  // some of these just don't work
  // "horizon",
  // "a",
  "horizontal_lines",
  "extreme_offset_blue",
  "ocean",
  "extreme_offset_green",
  "offset_green",
  "extra_offset_blue",
  "extra_offset_red",
  "extra_offset_green",
  "extreme_offset_red",
  "specks_redscale",
  "vintage",
  "perfume",
  "serenity",
  "eclectic",
  "diagonal_lines",
  "green_specks",
  "warmth",
  "casino",
  "green_diagonal_lines",
  "offset",
  "offset_blue",
  "neue",
  "sunset",
  "specks",
  "wood",
  "lix",
  "ryo",
  "bluescale",
  "solange",
  "evening",
  "crimson",
  "teal_min_noise",
  "phase",
  "dark_purple_min_noise",
  "coral",
  "darkify",
  "incbrightness",
  "incbrightness2",
  "yellow_casino",
  "invert",
  "sat_adj",
  "lemon",
  "pink_min_noise",
  "frontward",
  "pink_aura",
  "haze",
  "cool_twilight",
  "blues",
  "mellow",
  "solange_dark",
  "solange_grey",
  "zapt",
  "eon",
  "aeon",
  "matrix",
  "cosmic",
  "min_noise",
  "red_min_noise",
  "matrix2",
  "purplescale",
  "radio",
  "twenties",
  "pixel_blue",
  "greyscale",
  "grime",
  "redgreyscale",
  "retroviolet",
  "greengreyscale",
  "green_med_noise",
  "green_min_noise",
  "blue_min_noise",
  "rosetint",
  "purple_min_noise",
  "red_effect",
  "gamma",
  "teal_gamma",
  "purple_gamma",
  "yellow_gamma",
  "bluered_gamma",
  "green_gamma",
  "red_gamma",
  "black_specks",
  "white_specks",
  "salt_and_pepper",
  "rgbSplit",
  "threshold",
  "threshold75",
  "threshold125",
  "pixelate",
  "pixelate16",
]

filters.sort()

export class DandyPixelsJs extends DandyTown {
  constructor(node, app) {
    super(node, app)
    this.debug_verbose = false

    this.input.string = default_filter
    this.reload_iframe()
  }

  // this will run in the DandyTown constructor, before we make the iframe, 
  // so that the widgets will render above it.
  // if we did this in our constructor it would render below the content.
  init_widgets_above_content() {
    const { node } = this
    
    const filter_input_name = 'filter'
    // comfy gives us a string widget, we remove it and put our own
    this.remove_widgets(filter_input_name)
    this.filter_widget = node.addWidget('combo', filter_input_name, default_filter, 
      (x) => {
        console.warn("PIXELS NODE WIDGET", x)
        this.input.string = x
        this.reload_iframe()
      }, { values: filters })
  }

  // js_data returns a list of DandyChainData objects
  // use DandyJsClassicData(url) and DandyJsModuleData(url) to make those objects
  // they'll be loaded in the same order
  get js_data() {
    return [
      DandyJsClassicData('/extensions/dandy/Pixels-1.0.0/Pixels.js_'),
      DandyJsClassicData('/extensions/dandy/examples/pixels.js')
    ]
  } 
}