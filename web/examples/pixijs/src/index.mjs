
import DemoApplication from './DemoApplication.mjs'
import * as filters from './filters/index.mjs'
import { getEnabledFiltersFromQueryString } from './utils.mjs'

console.log(`dandy pixijs ::  w: ${dandy.width}, h: ${dandy.height}`, dandy)
dandy.onload = () => {
  console.log("index.mjs dandy.onload running")

  const main = async () =>
  {
    console.log("new demoApp")
    const app = new DemoApplication()
  
    app.enabledFilters = getEnabledFiltersFromQueryString()
  
    console.log(`app.enabledFilters`, app.enabledFilters)

    await app.init()
    await app.load([
      { alias: 'background', src: '/extensions/dandy/examples/pixijs/images/displacement_BG.jpg' },
      { alias: 'overlay', src: '/extensions/dandy/examples/pixijs/images/overlay.png' },
      { alias: 'map', src: '/extensions/dandy/examples/pixijs/images/displacement_map.png' },
      { alias: 'fish1', src: '/extensions/dandy/examples/pixijs/images/displacement_fish1.png' },
      { alias: 'fish2', src: '/extensions/dandy/examples/pixijs/images/displacement_fish2.png' },
      { alias: 'fish3', src: '/extensions/dandy/examples/pixijs/images/displacement_fish3.png' },
      { alias: 'fish4', src: '/extensions/dandy/examples/pixijs/images/displacement_fish4.png' },
      { alias: 'fish5', src: '/extensions/dandy/examples/pixijs/images/displacement_fish5.png' },
      { alias: 'lightmap', src: '/extensions/dandy/examples/pixijs/images/lightmap.png' },
      { alias: 'colormap', src: '/extensions/dandy/examples/pixijs/images/colormap.png' },
    ])
  
    for (const i in filters) {
      filters[i].call(app)
    }
    dandy.continue()
  }
  
  main()
}
