import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_TOC_SETTINGS,
  isDomainDisabled,
  normalizeDisabledDomains,
  normalizeFontSize,
  normalizeTheme,
  normalizeTocSettings,
} from '../src/content/settings'
import { Theme } from '../src/content/types'

test('normalizes theme to light or dark', () => {
  assert.equal(normalizeTheme(Theme.Dark), Theme.Dark)
  assert.equal(normalizeTheme('light'), Theme.Light)
  assert.equal(normalizeTheme('unexpected'), Theme.Light)
})

test('normalizes font size as a bounded number', () => {
  assert.equal(normalizeFontSize('18'), 18)
  assert.equal(normalizeFontSize(13.8), 14)
  assert.equal(normalizeFontSize('too-small'), DEFAULT_TOC_SETTINGS.fontSize)
  assert.equal(normalizeFontSize(4), 8)
  assert.equal(normalizeFontSize(80), 32)
})

test('normalizes disabled domains from arrays and textarea strings', () => {
  assert.deepEqual(
    normalizeDisabledDomains([
      ' HTTPS://www.Example.com:443/path ',
      'example.com',
      '',
      'developer.mozilla.org',
    ]),
    ['example.com', 'developer.mozilla.org'],
  )

  assert.deepEqual(
    normalizeDisabledDomains('alpha.test\nhttps://www.beta.test/page, alpha.test'),
    ['alpha.test', 'beta.test'],
  )
})

test('checks disabled domains against normalized hostnames', () => {
  assert.equal(isDomainDisabled('https://www.example.com/path', ['example.com']), true)
  assert.equal(isDomainDisabled('example.com:443', ['https://www.example.com']), true)
  assert.equal(isDomainDisabled('docs.example.com', ['example.com']), false)
})

test('normalizes the full TOC settings object', () => {
  assert.deepEqual(
    normalizeTocSettings({
      theme: Theme.Dark,
      fontSize: '20',
      disabledDomains: 'one.test\nhttps://www.two.test/path',
    }),
    {
      ...DEFAULT_TOC_SETTINGS,
      theme: Theme.Dark,
      fontSize: 20,
      disabledDomains: ['one.test', 'two.test'],
    },
  )
})
