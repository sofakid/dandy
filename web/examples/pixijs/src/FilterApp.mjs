/** Demo show a bunch of fish and a lil-gui controls */
export default class FilterApp extends PIXI.Application {
  constructor() {
    const gui = new lil.GUI();

    gui.useLocalStorage = false;

    // Get the initial dementions for the application
    const domElement = document.querySelector('#container');
    const initWidth = dandy.width;
    const initHeight = dandy.height;
    console.log(`width: ${initWidth}, height: ${initHeight}`)

    super();

    this.domElement = domElement;
    this.resources = null;
    this.initWidth = initWidth;
    this.initHeight = initHeight;
    this.animating = true;
    this.rendering = true;
    this.events = new PIXI.EventEmitter();
    this.animateTimer = 0;
    this.bg = null;
    this.pond = null;
    this.fishCount = 20;
    this.fishes = [];
    this.fishFilters = [];
    this.pondFilters = [];
    this.filters = {}
    this.filter_order = []
    this.loading = false

    this.filterArea = new PIXI.Rectangle();
    this.padding = 100;
    this.bounds = new PIXI.Rectangle(
      -this.padding,
      -this.padding,
      initWidth + (this.padding * 2),
      initHeight + (this.padding * 2),
    );

    this.enabledFilters = [];

    const app = this;

    this.gui = gui;
    // this.gui.add(this, 'rendering')
    //     .name('&bull; Rendering')
    //     .onChange((value) =>
    //     {
    //         if (!value)
    //         {
    //             app.stop();
    //         }
    //         else
    //         {
    //             app.start();
    //         }
    //     });
    // this.gui.add(this, 'animating')
    //     .name('&bull; Animating');

    gui.root.onFinishChange(() => {
      if (!this.loading) {
        console.log(`gui.onFinishedChange() ${this.pondFilters}`)
        dandy.message({ 
          command: 'save_options', 
          options: this.gui.save(),
          order: this.filter_order
        })
      }
    })

    window.addEventListener('message', (event) => {
      const { data } = event
      const { command } = data
      console.log(`index.mjs :: message received: `, data)
      if (command === 'delivering_options') {
        const { options, order } = data
        this.loading = true
        this.load_options(options, order)
        // give the onFinishedChanges a chance to run and do nothing
        setTimeout(() => {
          this.loading = false
        }, 100)
      }
    })
  }

  load_options(options, order) {
    const { gui } = this
    this.filter_order = order
    gui.load(options)
    this.apply_filters()
    // let it settle
    setTimeout(() => {
      dandy.continue()
    }, 150)
  }

  /** override init */
  init() {
    const preference = 'webgpu';

    return super.init({
      hello: true,
      width: this.initWidth,
      height: this.initHeight,
      autoStart: false,
      preference,
      useBackBuffer: true,
    });
  }

  /**
   * Load resources
   * @param {object} manifest Collection of resources to load
   */
  async load(manifest) {
    PIXI.Assets.addBundle('bundle', manifest);
    this.resources = await PIXI.Assets.loadBundle('bundle');
    this.setup();
    this.start();
  }

  setup() {
    document.body.appendChild(this.canvas);

    const { resources } = this;
    const { bounds, initWidth, initHeight } = this;

    // Setup the container
    this.pond = new PIXI.Container();
    this.pond.filterArea = this.filterArea;
    this.stage.addChild(this.pond);

    // Setup the background image
    const { Texture, Sprite } = PIXI
    const use_image = dandy.image.length > 0
    const texture = use_image ? Texture.from(dandy.image[0]) : new Texture()
    this.bg = new Sprite(texture);
    this.pond.addChild(this.bg);

    // Handle window resize event
    window.addEventListener('resize', this.handleResize.bind(this));
    this.handleResize();

  }

  /**
   * Resize the demo when the window resizes
   */
  handleResize() {
    const { padding, bg, filterArea, bounds, initWidth, initHeight } = this;

    const width = initWidth
    const height = initHeight
    // const width = this.domElement.offsetWidth;
    // const height = this.domElement.offsetHeight;
    const filterAreaPadding = 0;

    // Use equivalent of CSS's contain for the background
    // so that it scales proportionally
    const bgAspect = bg.texture.width / bg.texture.height;
    const winAspect = width / height;

    if (winAspect > bgAspect) {
      bg.width = width;
      bg.height = width / bgAspect;
    }
    else {
      bg.height = height;
      bg.width = height * bgAspect;
    }

    bg.x = (width - bg.width) / 2;
    bg.y = (height - bg.height) / 2;

    bounds.x = -padding;
    bounds.y = -padding;
    bounds.width = width + (padding * 2);
    bounds.height = height + (padding * 2);

    filterArea.x = filterAreaPadding;
    filterArea.y = filterAreaPadding;
    filterArea.width = width - (filterAreaPadding * 2);
    filterArea.height = height - (filterAreaPadding * 2);

    this.events.emit('resize', width, height);

    this.renderer.resize(width, height);

    this.render();
  }

  /**
   * Animate the fish, overlay and filters (if applicable)
   * @param {number} delta - % difference in time from last frame render
   */
  animate(time) {
    const delta = time.deltaTime;

    this.animateTimer += delta;

    const { bounds, animateTimer } = this;

    this.events.emit('animate', delta, animateTimer);

    if (!this.animating) {
      return;
    }

  }

  /**
   * Add a new filter
   * @param {string} id Class name
   * @param {object|function} options The class name of filter or options
   * @param {string} [options.id] The name of the filter class
   * @param {boolean} [options.global] Filter is in pixi.js
   * @param {array} [options.args] Constructor arguments
   * @param {boolean} [options.fishOnly=false] Apply to fish only, not whole scene
   * @param {boolean} [options.enabled=false] Filter is enabled by default
   * @param {function} [oncreate] Function takes filter and gui folder as
   *        arguments and is scoped to the Demo application.
   * @return {Filter} Instance of new filter
   */
  addFilter(id, options) {
    if (typeof options === 'function') {
      options = { oncreate: options }
    }

    options = Object.assign({
      name: id,
      enabled: false,
      opened: false,
      args: undefined,
      fishOnly: false,
      global: false,
      oncreate: null,
    }, options);

    const app = this
    const folder = this.gui.addFolder(options.name).close()
    const ClassRef = PIXI.filters[id] || PIXI[id]

    if (!ClassRef) {
      throw new Error(`Unable to find class name with "${id}"`)
    }

    const filter = new ClassRef(options.args)

    // Set enabled status
    filter.enabled = options.enabled

    const { filters } = this
    filters[id] = filter

    folder.add(filter, 'enabled').onChange((enabled) => {
      this.toggleFilter(id, enabled)
      app.events.emit('enable', enabled)

      this.render()
      if (enabled) {
        folder.domElement.className += ' enabled'
        folder.open()
      }
      else {
        folder.domElement.className = folder.domElement.className.replace(' enabled', '')
      }
    })

    if (filter.enabled) {
      folder.open()
      folder.domElement.className += ' enabled'
    }

    if (options.oncreate) {
      options.oncreate.call(filter, folder)
    }

    this.toggleFilter(id, filter.enabled)

    return filter;
  }

  apply_filters() {
    const { filters, filter_order, pond } = this
    pond.filters = []
    pond.filters = filter_order.map((id) => filters[id])
    this.render()
  }

  toggleFilter(id, enabled) {
    const { filter_order, loading } = this
    const i = filter_order.indexOf(id)
    if (enabled) {
      if (i === -1) {
        filter_order.push(id)
      }
    }
    else {
      if (i !== -1) {
        filter_order.splice(i, 1)
      }
    }

    if (!loading) {
      this.apply_filters()
    }
  }
}
