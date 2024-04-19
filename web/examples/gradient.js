// - we don't want our script running in comfyland, comfyui will load every js file.
// - we can check if dandy exists with typeof
// - if you have a bunch of files you can rename them .js_ and comfy won't load them
if (typeof dandy !== 'undefined') {
  dandy.onload = () => {
    const { width, height } = dandy
    
    dandy.message({ command: 'get_colors' })

    const pickers = document.createElement('div')
    pickers.classList.add('pickers')
    pickers.style.width = `${width}px`
    document.body.appendChild(pickers)

    
    const picker1 = document.createElement('div')
    picker1.classList.add('picker')
    pickers.appendChild(picker1)

    const swap_button = document.createElement('span')
    swap_button.classList.add('swap-button')
    swap_button.innerHTML = '⇄'
    pickers.appendChild(swap_button)

    const picker2 = document.createElement('div')
    picker2.classList.add('picker')
    pickers.appendChild(picker2)

    const c1_input = document.createElement('input')
    const c2_input = document.createElement('input')

    c1_input.classList.add('coloris')
    c2_input.classList.add('coloris')
    c1_input.classList.add('c1')
    c2_input.classList.add('c2')
    c1_input.type = 'text'
    c2_input.type = 'text'
    c1_input.value = 'red'
    c2_input.value = 'blue'
    
    picker1.appendChild(c1_input)
    picker2.appendChild(c2_input)
    
    Coloris({
      el: '.coloris',
      swatches: [
        '#264653',
        '#2a9d8f',
        '#e9c46a',
        '#f4a261',
        '#e76f51',
        '#d62828',
        '#023e8a',
        '#0077b6',
        '#0096c7',
        '#00b4d8',
        '#48cae4'
      ]
    })

    const options = {
      theme: 'polaroid',
      themeMode: 'dark',
      formatToggle: true,
      closeButton: true,
      clearButton: false,
      swatches: [
        '#067bc2',
        '#84bcda',
        '#80e377',
        '#ecc30b',
        '#f37748',
        '#d56062'
      ]
    }

    Coloris.setInstance('.c1', options)
    Coloris.setInstance('.c2', options)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')
  
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = 'white'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const text = 'click+drag mouse, +shift for radial'
    ctx.fillText(text, width / 2, height / 2);

    let startX = 0
    let startY = 0
    let is_shifty = false
  
    const mousedown = (event) => {
      const bounds = canvas.getBoundingClientRect()
      startX = event.clientX - bounds.left
      startY = event.clientY - bounds.top
    }
  
    const mouseup = (event) => {
      const bounds = canvas.getBoundingClientRect()
      const endX = event.clientX - bounds.left
      const endY = event.clientY - bounds.top
  
      if (is_shifty) {
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const gradient = ctx.createRadialGradient(startX, startY, 0, startX, startY, radius);
        gradient.addColorStop(0, c1_input.value);
        gradient.addColorStop(1, c2_input.value);
        ctx.fillStyle = gradient;
      } else {
        const gradient = ctx.createLinearGradient(startX, startY, endX, endY)
        gradient.addColorStop(0, c1_input.value)
        gradient.addColorStop(1, c2_input.value)
        ctx.fillStyle = gradient
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height)
  
      dandy.continue()
    }
  
    canvas.addEventListener('mousedown', mousedown)
    canvas.addEventListener('mouseup', mouseup)

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Shift') {
        is_shifty = true
      }
    })

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Shift') {
        is_shifty = false
      }
    })

    const update_thumbnails = () => {
      c1_input.dispatchEvent(new Event('input', { bubbles: true }))
      c2_input.dispatchEvent(new Event('input', { bubbles: true }))
    }

    window.addEventListener('message', (event) => {
      const { data } = event
      const { command } = data
      if (command === 'delivering_colors') {
        const { c1, c2 } = data
        c1_input.value = c1
        c2_input.value = c2
        update_thumbnails()
      }
    })

    const set_colors = () => {
      dandy.message({ command: 'set_colors', c1: c1_input.value, c2: c2_input.value })
    }
    c1_input.onchange = set_colors
    c2_input.onchange = set_colors

    const swap_colors = () => {
      const x = c1_input.value
      c1_input.value = c2_input.value
      c2_input.value = x
      update_thumbnails()
      set_colors()
    }

    swap_button.onclick = swap_colors

  }
}