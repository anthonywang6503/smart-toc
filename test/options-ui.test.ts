import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('options page provides an opacity slider from 1 to 100', () => {
  const html = readFileSync(
    new URL('../src/background/options.html', import.meta.url),
    'utf8',
  )
  const input = html.match(/<input[^>]*id="opacity"[^>]*>/)?.[0]

  assert.ok(input)
  assert.match(input, /type="range"/)
  assert.match(input, /min="1"/)
  assert.match(input, /max="100"/)
  assert.match(input, /step="1"/)
})
