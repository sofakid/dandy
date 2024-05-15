export default function ()
{
  // this doesn't work, the img tag doesn't work, 
  // and it seems like you're supposed to supply your own 
  // colormap so let's put this on the shelf for now.
  
  // const colorMap = this.resources.colormap;

    // this.addFilter('ColorMapFilter', {
    //     enabled: false,
    //     args: { colorMap },
    //     oncreate(folder)
    //     {
    //         folder.add(this, 'mix', 0, 1);
    //         folder.add(this, 'nearest');

    //         // eslint-disable-next-line no-empty-function
    //         this._noop = () => {};
    //         folder.add(this, '_noop').name('<img src="/extensions/dandy/examples/pixijs/images/colormap.png" width="220" height="13" />');
    //     },
    // });
}
