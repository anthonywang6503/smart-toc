(function (root) {
  const MIN_TOC_FONT_SIZE = 8
  const MAX_TOC_FONT_SIZE = 32
  const MIN_TOC_OPACITY = 1
  const MAX_TOC_OPACITY = 100

  const DEFAULT_TOC_SETTINGS = {
    autoType: '0',
    isShowTip: true,
    isRememberPos: true,
    selectorInoreader: '.article_content',
    selectorFeedly: '.entryBody',
    theme: 'light',
    fontSize: 12,
    opacity: 100,
    disabledDomains: [],
  }

  const normalizeTheme = (value) => {
    return value === 'dark' ? 'dark' : 'light'
  }

  const normalizeFontSize = (value) => {
    const numberValue =
      typeof value === 'number' ? value : Number(String(value).trim())

    if (!Number.isFinite(numberValue)) {
      return DEFAULT_TOC_SETTINGS.fontSize
    }

    return Math.min(
      MAX_TOC_FONT_SIZE,
      Math.max(MIN_TOC_FONT_SIZE, Math.round(numberValue)),
    )
  }

  const normalizeOpacity = (value) => {
    const numberValue =
      typeof value === 'number' ? value : Number(String(value).trim())

    if (!Number.isFinite(numberValue)) {
      return DEFAULT_TOC_SETTINGS.opacity
    }

    return Math.min(
      MAX_TOC_OPACITY,
      Math.max(MIN_TOC_OPACITY, Math.round(numberValue)),
    )
  }

  const normalizeDomain = (value) => {
    const trimmed = String(value).trim().toLowerCase()
    if (!trimmed) {
      return ''
    }

    try {
      const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
      return url.hostname.replace(/\.$/, '').replace(/^www\./, '')
    } catch {
      const host = trimmed.split('/')[0].split(':')[0]
      return host.replace(/\.$/, '').replace(/^www\./, '')
    }
  }

  const normalizeDisabledDomains = (value) => {
    const entries = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(/[\n,]/)
        : []
    const normalizedDomains = []

    entries.forEach((entry) => {
      const domain = normalizeDomain(entry)
      if (domain && !normalizedDomains.includes(domain)) {
        normalizedDomains.push(domain)
      }
    })

    return normalizedDomains
  }

  const isDomainDisabled = (hostnameOrUrl, disabledDomains) => {
    const domain = normalizeDomain(hostnameOrUrl)
    return normalizeDisabledDomains(disabledDomains).includes(domain)
  }

  const normalizeTocSettings = (settings) => {
    const source = settings || {}
    return {
      ...DEFAULT_TOC_SETTINGS,
      autoType:
        source.autoType === '1' || source.autoType === '2'
          ? source.autoType
          : DEFAULT_TOC_SETTINGS.autoType,
      isShowTip:
        typeof source.isShowTip === 'boolean'
          ? source.isShowTip
          : DEFAULT_TOC_SETTINGS.isShowTip,
      isRememberPos:
        typeof source.isRememberPos === 'boolean'
          ? source.isRememberPos
          : DEFAULT_TOC_SETTINGS.isRememberPos,
      selectorInoreader:
        typeof source.selectorInoreader === 'string' &&
        source.selectorInoreader.trim()
          ? source.selectorInoreader.trim()
          : DEFAULT_TOC_SETTINGS.selectorInoreader,
      selectorFeedly:
        typeof source.selectorFeedly === 'string' && source.selectorFeedly.trim()
          ? source.selectorFeedly.trim()
          : DEFAULT_TOC_SETTINGS.selectorFeedly,
      theme: normalizeTheme(source.theme),
      fontSize: normalizeFontSize(source.fontSize),
      opacity: normalizeOpacity(source.opacity),
      disabledDomains: normalizeDisabledDomains(source.disabledDomains),
    }
  }

  const api = {
    DEFAULT_TOC_SETTINGS,
    MIN_TOC_FONT_SIZE,
    MAX_TOC_FONT_SIZE,
    MIN_TOC_OPACITY,
    MAX_TOC_OPACITY,
    normalizeTheme,
    normalizeFontSize,
    normalizeOpacity,
    normalizeDomain,
    normalizeDisabledDomains,
    isDomainDisabled,
    normalizeTocSettings,
  }

  root.SmartTocSettings = api

  if (typeof module !== 'undefined') {
    module.exports = api
  }
})(typeof self !== 'undefined' ? self : globalThis)
