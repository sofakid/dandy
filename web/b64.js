import { DandyImageUrlChain, IO } from "/extensions/dandy/chains.js"
import { DandyNames, DandyTypes, DandyNode } from "/extensions/dandy/dandymisc.js"

export class DandyB64Encoder extends DandyNode {
  constructor(node, app) {
    super(node, app)
    this.images_chain = new DandyImageUrlChain(this, IO.IN_OUT)
    
    this.dirty_widget = this.find_widget(DandyNames.DIRTY)
    this.images_widget = this.find_widget(DandyNames.IMAGE_URL)
    
    this.dirty_widget.value = true
    this.images_widget.value = []
    this.masks_widget.value = []
  }

  on_configure() {
    this.dirty_widget.value = true
  }

  on_executed(output) {
    const { b64images } = output 
    
    const { images_chain } = this
    const images_widget = this.find_widget(DandyNames.IMAGE_URL)
    const last_images = images_widget.value

    if (last_images !== b64images) {
      images_widget.value = b64images
      images_chain.contributions = b64images
      images_chain.update_chain()
    }
  }
}