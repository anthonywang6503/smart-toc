import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const settings = require('../src/background/settings.js')

test('background settings helper normalizes domains for options and context menus', () => {
  assert.deepEqual(
    settings.normalizeDisabledDomains('https://www.example.com/path\nEXAMPLE.com'),
    ['example.com'],
  )
  assert.equal(settings.isDomainDisabled('www.example.com:443', ['example.com']), true)
  assert.equal(settings.isDomainDisabled('docs.example.com', ['example.com']), false)
})

test('background settings helper exposes storage defaults', () => {
  assert.deepEqual(settings.DEFAULT_TOC_SETTINGS, {
    autoType: '0',
    isShowTip: true,
    isRememberPos: true,
    selectorInoreader: '.article_content',
    selectorFeedly: '.entryBody',
    theme: 'light',
    fontSize: 12,
    opacity: 100,
    disabledDomains: [],
  })
})

test('background settings helper normalizes opacity from 1 to 100', () => {
  assert.equal(settings.normalizeOpacity('75'), 75)
  assert.equal(settings.normalizeOpacity(0), 1)
  assert.equal(settings.normalizeOpacity(101), 100)
  assert.equal(settings.normalizeOpacity('invalid'), 100)
})
