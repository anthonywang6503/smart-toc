import { Theme } from './types'

export const MIN_TOC_FONT_SIZE = 8
export const MAX_TOC_FONT_SIZE = 32
export const MIN_TOC_OPACITY = 1
export const MAX_TOC_OPACITY = 100

export interface TocSettings {
  autoType: '0' | '1' | '2'
  isShowTip: boolean
  isRememberPos: boolean
  selectorInoreader: string
  selectorFeedly: string
  theme: Theme
  fontSize: number
  opacity: number
  disabledDomains: string[]
}

export const DEFAULT_TOC_SETTINGS: TocSettings = {
  autoType: '0',
  isShowTip: true,
  isRememberPos: true,
  selectorInoreader: '.article_content',
  selectorFeedly: '.entryBody',
  theme: Theme.Light,
  fontSize: 12,
  opacity: 100,
  disabledDomains: [],
}

export const normalizeTheme = (value: unknown): Theme => {
  return value === Theme.Dark ? Theme.Dark : Theme.Light
}

export const normalizeFontSize = (value: unknown): number => {
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

export const normalizeOpacity = (value: unknown): number => {
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

export const normalizeDomain = (value: string): string => {
  const trimmed = value.trim().toLowerCase()
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

export const normalizeDisabledDomains = (value: unknown): string[] => {
  const entries = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\n,]/)
      : []
  const normalizedDomains: string[] = []

  entries.forEach((entry) => {
    const domain = normalizeDomain(String(entry))
    if (domain && !normalizedDomains.includes(domain)) {
      normalizedDomains.push(domain)
    }
  })

  return normalizedDomains
}

export const isDomainDisabled = (
  hostnameOrUrl: string,
  disabledDomains: unknown,
): boolean => {
  const domain = normalizeDomain(hostnameOrUrl)
  return normalizeDisabledDomains(disabledDomains).includes(domain)
}

export const normalizeTocSettings = (
  settings: Partial<Record<keyof TocSettings, unknown>>,
): TocSettings => {
  return {
    ...DEFAULT_TOC_SETTINGS,
    autoType:
      settings.autoType === '1' || settings.autoType === '2'
        ? settings.autoType
        : DEFAULT_TOC_SETTINGS.autoType,
    isShowTip:
      typeof settings.isShowTip === 'boolean'
        ? settings.isShowTip
        : DEFAULT_TOC_SETTINGS.isShowTip,
    isRememberPos:
      typeof settings.isRememberPos === 'boolean'
        ? settings.isRememberPos
        : DEFAULT_TOC_SETTINGS.isRememberPos,
    selectorInoreader:
      typeof settings.selectorInoreader === 'string' &&
      settings.selectorInoreader.trim()
        ? settings.selectorInoreader.trim()
        : DEFAULT_TOC_SETTINGS.selectorInoreader,
    selectorFeedly:
      typeof settings.selectorFeedly === 'string' &&
      settings.selectorFeedly.trim()
        ? settings.selectorFeedly.trim()
        : DEFAULT_TOC_SETTINGS.selectorFeedly,
    theme: normalizeTheme(settings.theme),
    fontSize: normalizeFontSize(settings.fontSize),
    opacity: normalizeOpacity(settings.opacity),
    disabledDomains: normalizeDisabledDomains(settings.disabledDomains),
  }
}
