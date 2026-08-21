import {
  DEFAULT_OG_IMAGE,
  getSiteName,
  OG_LOCALES,
  PRIVATE_ROBOTS,
  SITE_NAME,
  SITE_URL
} from '@/constants/seo'
import { getStoredLocale } from '@/i18n'

// Maps a public page's path to its counterpart in the other supported
// locale (e.g. '/features' <-> '/ur/features', '/' <-> '/ur'). Shared by
// the hreflang alternate links below and the header language switcher.
export function getAlternateLocalePath(path) {
  if (path === '/ur' || path.startsWith('/ur/')) {
    const enPath = path.slice(3)
    return { locale: 'en', path: enPath || '/' }
  }

  return { locale: 'ur', path: path === '/' ? '/ur' : `/ur${path}` }
}

// Strips a leading /ur prefix from a path (e.g. '/ur/login' -> '/login',
// '/ur' -> '/'). Used where a route's locale-agnostic base path is needed,
// such as deriving login/register mode from the current URL.
export function stripLocalePrefix(path) {
  if (path === '/ur') return '/'
  if (path.startsWith('/ur/')) return path.slice(3)
  return path
}

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

function upsertAlternateLinks(links) {
  if (typeof document === 'undefined') return

  document
    .querySelectorAll('link[rel="alternate"][data-route-seo]')
    .forEach((el) => el.remove())

  links.forEach(({ hreflang, href }) => {
    const link = document.createElement('link')
    link.setAttribute('rel', 'alternate')
    link.setAttribute('hreflang', hreflang)
    link.setAttribute('href', href)
    link.setAttribute('data-route-seo', 'true')
    document.head.appendChild(link)
  })
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
    return value.replace(
      /__([A-Z_]+)__/g,
      (_, token) => replacements[token] || ''
    )
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

function localizeBrandName(value, locale) {
  const localizedSiteName = getSiteName(locale)
  if (localizedSiteName === SITE_NAME) return value

  if (typeof value === 'string') {
    return value.split(SITE_NAME).join(localizedSiteName)
  }

  if (Array.isArray(value)) {
    return value.map((item) => localizeBrandName(item, locale))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        localizeBrandName(entry, locale)
      ])
    )
  }

  return value
}

export function applySeoForRoute(route) {
  if (typeof window === 'undefined' || !route) return

  const origin = window.location.origin || SITE_URL
  const locale = route.meta?.locale ?? getStoredLocale()
  const localizedSiteName = getSiteName(locale)
  const seo = localizeBrandName(
    route.meta?.seo || {
      title: SITE_NAME,
      description: `${SITE_NAME} web app`,
      robots: PRIVATE_ROBOTS
    },
    locale
  )
  const path = seo.canonicalPath || route.fullPath || route.path || '/'
  const canonicalUrl = new URL(path, origin).toString()
  const imageUrl = resolveAbsoluteUrl(seo.image, origin)

  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ur' ? 'rtl' : 'ltr'
  document.title = seo.title || localizedSiteName

  upsertMeta('description', seo.description)
  upsertMeta('keywords', seo.keywords)
  upsertMeta('robots', seo.robots || PRIVATE_ROBOTS)
  upsertMeta('author', localizedSiteName)
  upsertMeta('application-name', localizedSiteName)

  upsertMeta('og:type', seo.ogType || 'website', 'property')
  upsertMeta(
    'og:title',
    seo.ogTitle || seo.title || localizedSiteName,
    'property'
  )
  upsertMeta('og:description', seo.ogDescription || seo.description, 'property')
  upsertMeta('og:url', canonicalUrl, 'property')
  upsertMeta('og:site_name', localizedSiteName, 'property')
  upsertMeta('og:image', imageUrl, 'property')
  upsertMeta('og:locale', OG_LOCALES[locale] || OG_LOCALES.en, 'property')

  upsertMeta('twitter:card', 'summary_large_image')
  upsertMeta(
    'twitter:title',
    seo.twitterTitle || seo.title || localizedSiteName
  )
  upsertMeta('twitter:description', seo.twitterDescription || seo.description)
  upsertMeta('twitter:image', imageUrl)

  upsertCanonical(canonicalUrl)

  if (route.meta?.publicPage === true) {
    const alternate = getAlternateLocalePath(route.path || '/')
    const alternateUrl = new URL(alternate.path, origin).toString()
    upsertAlternateLinks([
      { hreflang: locale, href: canonicalUrl },
      { hreflang: alternate.locale, href: alternateUrl },
      {
        hreflang: 'x-default',
        href: locale === 'en' ? canonicalUrl : alternateUrl
      }
    ])
  } else {
    upsertAlternateLinks([])
  }

  const structuredData = replaceSeoTokens(seo.structuredData, {
    PAGE_URL: canonicalUrl,
    SITE_URL: origin,
    IMAGE_URL: imageUrl
  })
  upsertStructuredData(structuredData)
}
