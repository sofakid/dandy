// - we don't want our script running in comfyland, comfyui will load every js file.
// - we can check if dandy exists with typeof
// - if you have a bunch of files you can rename them .js_ and comfy won't load them
if (typeof dandy !== 'undefined') {
  dandy.onload = () => {
    const img = dandy.image[0]
    //console.log("PIXELS ", img, dandy.string, dandy)
    if (img) {
      const filter = dandy.string
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
  
      const w = canvas.width = img.width
      const h = canvas.height = img.height
  
      ctx.drawImage(img, 0, 0)
      const image_data = ctx.getImageData(0, 0, w, h)
      const filtered = pixelsJS.filterImgData(image_data, filter)
      //console.log("PIXELS  FILTERED:", filtered)
      ctx.putImageData(filtered, 0, 0)
  
      document.body.appendChild(canvas)
    }
    dandy.continue()
  }
}