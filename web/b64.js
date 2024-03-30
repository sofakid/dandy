import { DandyB64ImagesChain, DandyB64MasksChain } from "/extensions/dandy/chains.js"
import { DandyNames, DandyTypes, DandyNode } from "/extensions/dandy/dandymisc.js"

export class DandyB64Encoder extends DandyNode {
  constructor(node, app) {
    super(node, app)
    this.images_chain = new DandyB64ImagesChain(this)
    this.masks_chain = new DandyB64MasksChain(this)
    
    this.dirty_widget = this.find_widget(DandyNames.DIRTY)
    this.images_widget = this.find_widget(DandyNames.B64IMAGES)
    this.masks_widget = this.find_widget(DandyNames.B64MASKS)
    
    this.dirty_widget.value = true
    this.images_widget.value = []
    this.masks_widget.value = []
  }

  on_configure() {
    this.dirty_widget.value = true
  }

  on_executed(output) {
    const { b64images, b64masks } = output 
    //console.log("B64Encoder.on_executed:", b64images.slice(0, 50), b64masks.slice(0, 50))
    
    const { images_chain, masks_chain } = this

    const images_widget = this.find_widget(DandyNames.B64IMAGES)
    const masks_widget = this.find_widget(DandyNames.B64MASKS)

    const last_images = images_widget.value
    const last_masks = masks_widget.value

    if (last_images !== b64images) {
      images_widget.value = b64images
      images_chain.contributions = b64images
      images_chain.update_chain()
    }
    if (last_masks !== b64masks) {
      masks_widget.value = b64masks
      masks_chain.contributions = b64masks
      masks_chain.update_chain()
    }
  }
}