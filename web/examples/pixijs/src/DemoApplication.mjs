/** Demo show a bunch of fish and a lil-gui controls */
export default class DemoApplication extends PIXI.Application
{
    constructor()
    {
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
        this.gui.add(this, 'rendering')
            .name('&bull; Rendering')
            .onChange((value) =>
            {
                if (!value)
                {
                    app.stop();
                }
                else
                {
                    app.start();
                }
            });
        this.gui.add(this, 'animating')
            .name('&bull; Animating');
    }

    /** override init */
    init()
    {
        const preference = (new URLSearchParams(window.location.search)).get('preference') || 'webgpu';

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
    async load(manifest)
    {
        PIXI.Assets.addBundle('bundle', manifest);
        this.resources = await PIXI.Assets.loadBundle('bundle');
        this.setup();
        this.start();
    }

    setup()
    {
        document.body.appendChild(this.canvas);

        const { resources } = this;
        const { bounds, initWidth, initHeight } = this;

        // Setup the container
        this.pond = new PIXI.Container();
        this.pond.filterArea = this.filterArea;
        this.stage.addChild(this.pond);

        // Setup the background image
        
        // Setup the background image
        if (dandy.image.length > 0) {
          const texture = PIXI.Texture.from(dandy.image[0]);
          this.bg = new PIXI.Sprite(texture);
          // this.bg = PIXI.Sprite.from(dandy.image[0]);
        } else {
          const texture = new PIXI.Texture();
          this.bg = new PIXI.Sprite(texture); 
        }
        this.pond.addChild(this.bg);
          
        // Setup the tiling sprite
        this.overlay = new PIXI.TilingSprite({
            texture: resources.overlay,
            width: initWidth,
            height: initHeight,
        });

        // Add the overlay
        //this.pond.addChild(this.overlay);

        // Handle window resize event
        window.addEventListener('resize', this.handleResize.bind(this));
        this.handleResize();

        // Handle fish animation
        //this.ticker.add(this.animate, this);
    }

    /**
     * Resize the demo when the window resizes
     */
    handleResize()
    {
        const { padding, bg, overlay, filterArea, bounds, initWidth, initHeight } = this;

        const width = initWidth
        const height = initHeight
        // const width = this.domElement.offsetWidth;
        // const height = this.domElement.offsetHeight;
        const filterAreaPadding = 0;

        // Use equivalent of CSS's contain for the background
        // so that it scales proportionally
        const bgAspect = bg.texture.width / bg.texture.height;
        const winAspect = width / height;

        if (winAspect > bgAspect)
        {
            bg.width = width;
            bg.height = width / bgAspect;
        }
        else
        {
            bg.height = height;
            bg.width = height * bgAspect;
        }

        bg.x = (width - bg.width) / 2;
        bg.y = (height - bg.height) / 2;

        overlay.width = width;
        overlay.height = height;

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
    animate(time)
    {
        const delta = time.deltaTime;

        this.animateTimer += delta;

        const { bounds, animateTimer, overlay } = this;

        this.events.emit('animate', delta, animateTimer);

        if (!this.animating)
        {
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
    addFilter(id, options)
    {
        if (typeof options === 'function')
        {
            options = { oncreate: options };
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

        const app = this;
        const folder = this.gui.addFolder(options.name).close();
        const ClassRef = PIXI.filters[id] || PIXI[id];

        if (!ClassRef)
        {
            throw new Error(`Unable to find class name with "${id}"`);
        }

        const filter = new ClassRef(options.args);

        // Set enabled status
        filter.enabled = (options.enabled && this.enabledFilters.length === 0) || this.enabledFilters.includes(id);

        // TODO: This is a hack for the issue with the 'enabled' toggling
        // https://github.com/orgs/pixijs/projects/2/views/4?pane=issue&itemId=48582986
        const toggleFilter = (enabled) =>
        {
            
          const pondFilters = [...this.pondFilters];

          if (enabled)
          {
              pondFilters.push(filter);
          }
          else
          {
              const index = pondFilters.indexOf(filter);

              if (index !== -1) pondFilters.splice(index, 1);
          }

          this.pondFilters = pondFilters;
          // TODO: seems like a bug, requiring invalidation
          this.pond.filters = [];
          this.pond.filters = pondFilters; // this is where it applies the filter
        };

        // Track enabled change with analytics
        folder.add(filter, 'enabled').onChange((enabled) =>
        {
            toggleFilter(enabled);
            app.events.emit('enable', enabled);
            dandy.message({ command: 'save_options', options: this.gui.save()})

            this.render();
            if (enabled)
            {
                folder.domElement.className += ' enabled';
            }
            else
            {
                folder.domElement.className = folder.domElement.className.replace(' enabled', '');
            }
        });

        if (filter.enabled)
        {
            folder.open();
            folder.domElement.className += ' enabled';
        }

        if (options.oncreate)
        {
            options.oncreate.call(filter, folder);
        }

        toggleFilter(filter.enabled);

        return filter;
    }
}
