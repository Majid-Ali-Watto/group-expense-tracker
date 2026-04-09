import {
  DEFAULT_OG_IMAGE,
  PRIVATE_ROBOTS,
  SITE_NAME,
  SITE_URL
} from '@/constants/seo'

function upsertMeta(key, value, attr = 'name') {
  if (typeof document === 'undefined') return

  let element = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }

  if (!value) {
    element.remove()
    return
  }

  element.setAttribute('content', value)
}

function upsertCanonical(href) {
  if (typeof document === 'undefined') return

  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }

  canonical.setAttribute('href', href)
}

function upsertStructuredData(data) {
  if (typeof document === 'undefined') return

  const id = 'route-seo-structured-data'
  let script = document.getElementById(id)

  if (!data || (Array.isArray(data) && !data.length)) {
    if (script) script.remove()
    return
  }

  if (!script) {
    script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }

  script.textContent = JSON.stringify(data)
}

function resolveAbsoluteUrl(value, origin) {
  if (!value) return `${origin}${DEFAULT_OG_IMAGE}`
  if (/^https?:\/\//i.test(value)) return value
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`
}

function replaceSeoTokens(value, replacements) {
  if (typeof value === 'string') {
    return value.replace(/__([A-Z_]+)__/g, (_, token) => replacements[token] || '')
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceSeoTokens(item, replacements))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        replaceSeoTokens(entry, replacements)
      ])
    )
  }

  return value
}

export function applySeoForRoute(route) {
  if (typeof window === 'undefined' || !route) return

  const origin = window.location.origin || SITE_URL
  const seo = route.meta?.seo || {
    title: SITE_NAME,
    description: `${SITE_NAME} web app`,
    robots: PRIVATE_ROBOTS
  }
  const path = seo.canonicalPath || route.fullPath || route.path || '/'
  const canonicalUrl = new URL(path, origin).toString()
  const imageUrl = resolveAbsoluteUrl(seo.image, origin)

  document.documentElement.lang = 'en'
  document.title = seo.title || SITE_NAME

  upsertMeta('description', seo.description)
  upsertMeta('keywords', seo.keywords)
  upsertMeta('robots', seo.robots || PRIVATE_ROBOTS)
  upsertMeta('author', SITE_NAME)
  upsertMeta('application-name', SITE_NAME)

  upsertMeta('og:type', seo.ogType || 'website', 'property')
  upsertMeta('og:title', seo.ogTitle || seo.title || SITE_NAME, 'property')
  upsertMeta('og:description', seo.ogDescription || seo.description, 'property')
  upsertMeta('og:url', canonicalUrl, 'property')
  upsertMeta('og:site_name', SITE_NAME, 'property')
  upsertMeta('og:image', imageUrl, 'property')

  upsertMeta('twitter:card', 'summary_large_image')
  upsertMeta('twitter:title', seo.twitterTitle || seo.title || SITE_NAME)
  upsertMeta(
    'twitter:description',
    seo.twitterDescription || seo.description
  )
  upsertMeta('twitter:image', imageUrl)

  upsertCanonical(canonicalUrl)

  const structuredData = replaceSeoTokens(seo.structuredData, {
    PAGE_URL: canonicalUrl,
    SITE_URL: origin,
    IMAGE_URL: imageUrl
  })
  upsertStructuredData(structuredData)
}

