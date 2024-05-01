// this is all based off of the PixiJS-Filter demo code.

import FilterApp from './FilterApp.mjs'
import * as filters from './filters/index.mjs'

dandy.onload = () => {

  const main = async () => {
    const app = new FilterApp()

    await app.init()
    await app.load([
      { alias: 'background', src: '/extensions/dandy/examples/pixijs/images/displacement_BG.jpg' },
      { alias: 'overlay', src: '/extensions/dandy/examples/pixijs/images/overlay.png' },
      { alias: 'map', src: '/extensions/dandy/examples/pixijs/images/displacement_map.png' },
      { alias: 'lightmap', src: '/extensions/dandy/examples/pixijs/images/lightmap.png' },
      { alias: 'colormap', src: '/extensions/dandy/examples/pixijs/images/colormap.png' },
    ])
  
    for (const i in filters) {
      filters[i].call(app)
    }

    dandy.message({ command: 'get_options' })
  }
  
  main()
}
