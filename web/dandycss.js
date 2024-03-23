
const dandy_css = `/extensions/dandy/dandy.css`

const load_css = (doc, url) => {
  const link = doc.createElement("link")
  link.rel = 'stylesheet'
  link.type = 'text/css'
  link.href = url
  doc.head.appendChild(link)
}

export const load_dandy_css = (doc) => {
  load_css(doc, dandy_css)
}

export const dandy_css_link = `<link rel="stylesheet" type="text/css" href="${dandy_css}" />`
