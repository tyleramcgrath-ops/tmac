/**
 * RankForge AI — embeddable SEO audit widget loader.
 *
 * Drop this on any site to render the lead-capture audit widget:
 *
 *   <script async
 *     src="https://YOUR-DOMAIN/widget.js"
 *     data-domain="clientsite.com"></script>
 *
 * The script injects an <iframe> pointing at /widget on the same origin it was
 * served from, and auto-resizes it to fit the content via postMessage.
 * Optional attributes:
 *   data-domain   prefill the domain field
 *   data-height   initial height in px (default 520)
 *   data-accent   brand accent color, e.g. "#7c5cff"
 *   data-logo     absolute https URL to your logo
 *   data-name     your brand name (shown in the widget header)
 */
(function () {
  var script = document.currentScript
  if (!script) return

  var origin
  try {
    origin = new URL(script.src).origin
  } catch (e) {
    return
  }

  var initialHeight = parseInt(script.getAttribute('data-height') || '520', 10)

  var params = new URLSearchParams()
  var map = { domain: 'data-domain', accent: 'data-accent', logo: 'data-logo', name: 'data-name' }
  Object.keys(map).forEach(function (key) {
    var val = script.getAttribute(map[key])
    if (val) params.set(key, val)
  })
  var qs = params.toString()
  var src = origin + '/widget' + (qs ? '?' + qs : '')

  var iframe = document.createElement('iframe')
  iframe.src = src
  iframe.title = 'Free SEO Audit by RankForge AI'
  iframe.loading = 'lazy'
  iframe.setAttribute('scrolling', 'no')
  iframe.style.width = '100%'
  iframe.style.border = '0'
  iframe.style.height = initialHeight + 'px'
  iframe.style.colorScheme = 'normal'
  iframe.style.maxWidth = '720px'
  iframe.style.display = 'block'

  var parent = script.parentNode || document.body
  parent.insertBefore(iframe, script)

  window.addEventListener('message', function (event) {
    if (event.origin !== origin) return
    var data = event.data
    if (
      data &&
      data.type === 'rankforge:height' &&
      typeof data.height === 'number' &&
      data.height > 0
    ) {
      iframe.style.height = Math.ceil(data.height) + 'px'
    }
  })
})()
