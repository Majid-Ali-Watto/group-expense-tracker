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

// Builds a plain @unhead/vue head-config object for a route. Pure — no DOM
// access, so it runs identically during SSG prerendering (Node) and on the
// client. Replaces the old DOM-mutation based applySeoForRoute; see
// src/App.vue for the single `useHead()` call site that consumes this.
export function buildHeadConfig(route) {
  if (!route) return {}

  // No `window` during SSG prerendering — fall back to the canonical site
  // origin so prerendered canonical/OG/alternate URLs are still correct.
  const origin =
    (typeof window !== 'undefined' && window.location.origin) || SITE_URL
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
  const ogTitle = seo.ogTitle || seo.title || localizedSiteName
  // DEFAULT_OG_IMAGE is a known 1000x560 asset; a page-specific seo.image
  // may be any size, so only assert dimensions for the shared default.
  const imageIsDefault = !seo.image

  const meta = [
    { name: 'description', content: seo.description },
    { name: 'keywords', content: seo.keywords },
    { name: 'robots', content: seo.robots || PRIVATE_ROBOTS },
    { name: 'author', content: localizedSiteName },
    { name: 'application-name', content: localizedSiteName },
    { property: 'og:type', content: seo.ogType || 'website' },
    { property: 'og:title', content: ogTitle },
    {
      property: 'og:description',
      content: seo.ogDescription || seo.description
    },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:site_name', content: localizedSiteName },
    { property: 'og:image', content: imageUrl },
    imageIsDefault && { property: 'og:image:width', content: '1000' },
    imageIsDefault && { property: 'og:image:height', content: '560' },
    { property: 'og:image:alt', content: ogTitle },
    { property: 'og:locale', content: OG_LOCALES[locale] || OG_LOCALES.en },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@Kharchafy' },
    {
      name: 'twitter:title',
      content: seo.twitterTitle || seo.title || localizedSiteName
    },
    {
      name: 'twitter:description',
      content: seo.twitterDescription || seo.description
    },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:image:alt', content: ogTitle }
  ].filter((entry) => entry && entry.content)

  const link = [{ rel: 'canonical', href: canonicalUrl }]

  if (route.meta?.publicPage === true) {
    const alternate = getAlternateLocalePath(route.path || '/')
    const alternateUrl = new URL(alternate.path, origin).toString()
    link.push(
      { rel: 'alternate', hreflang: locale, href: canonicalUrl },
      { rel: 'alternate', hreflang: alternate.locale, href: alternateUrl },
      {
        rel: 'alternate',
        hreflang: 'x-default',
        href: locale === 'en' ? canonicalUrl : alternateUrl
      }
    )
  }

  const structuredData = replaceSeoTokens(seo.structuredData, {
    PAGE_URL: canonicalUrl,
    SITE_URL: origin,
    IMAGE_URL: imageUrl
  })

  const script =
    structuredData && (!Array.isArray(structuredData) || structuredData.length)
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify(structuredData)
          }
        ]
      : []

  return {
    title: seo.title || localizedSiteName,
    htmlAttrs: { lang: locale, dir: locale === 'ur' ? 'rtl' : 'ltr' },
    meta,
    link,
    script
  }
}
