import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import m from 'mithril'
import { Handle, HandleAttrs } from '../src/content/ui/handle'

const event = {
  preventDefault() {},
  stopPropagation() {},
}

const renderHandle = (onCollapseChange: (isCollapsed: boolean) => void) => {
  const attrs: HandleAttrs = {
    userOffset: { x: 0, y: 0 },
    onDrag() {},
    onCollapseChange,
  }
  const vnode = { attrs } as any
  const component = Handle(vnode) as any
  return {
    component,
    vnode,
    view: () => component.view(vnode),
  }
}

test('TOC handle toggles between expanded and collapsed states', () => {
  const changes: boolean[] = []
  const handle = renderHandle((isCollapsed) => changes.push(isCollapsed))

  let toggle = handle.view().children[0]
  assert.equal(toggle.attrs['aria-expanded'], true)
  assert.equal(toggle.children[0].children, 'TABLE OF CONTENTS ▾')

  toggle.attrs.onclick(event)
  toggle = handle.view().children[0]
  assert.equal(toggle.attrs['aria-expanded'], false)
  assert.equal(toggle.children[0].children, 'TABLE OF CONTENTS ▸')
  assert.deepEqual(changes, [true])

  toggle.attrs.onclick(event)
  toggle = handle.view().children[0]
  assert.equal(toggle.attrs['aria-expanded'], true)
  assert.equal(toggle.children[0].children, 'TABLE OF CONTENTS ▾')
  assert.deepEqual(changes, [true, false])
})

test('dragging the TOC handle does not toggle its collapsed state', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const originalRedraw = m.redraw
  const listeners: Record<string, (event: any) => void> = {}
  const redraw = (() => {}) as typeof m.redraw
  redraw.sync = () => {}
  m.redraw = redraw
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      addEventListener(type: string, listener: (event: any) => void) {
        listeners[type] = listener
      },
      removeEventListener(type: string) {
        delete listeners[type]
      },
    },
  })

  try {
    const changes: boolean[] = []
    const handle = renderHandle((isCollapsed) => changes.push(isCollapsed))
    const view = handle.view()

    view.attrs.onmousedown({
      ...event,
      button: 0,
      clientX: 10,
      clientY: 10,
    })
    listeners.mousemove({ ...event, clientX: 20, clientY: 10 })
    listeners.mouseup(event)
    view.children[0].attrs.onclick(event)

    assert.deepEqual(changes, [])
    assert.equal(handle.view().children[0].attrs['aria-expanded'], true)
  } finally {
    m.redraw = originalRedraw
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow)
    } else {
      delete (globalThis as any).window
    }
  }
})

test('TOC styles keep the handle visible, use a white dark-theme title, and hide collapsed content', () => {
  const css = readFileSync(
    new URL('../src/content/style/toc.css', import.meta.url),
    'utf8',
  )

  assert.match(css, /#smarttoc \.handle\s*{[^}]*opacity:\s*1;/)
  assert.match(
    css,
    /#smarttoc\.theme-dark \.handle-toggle\s*{[^}]*color:\s*#fff;/,
  )
  assert.match(
    css,
    /#smarttoc\.collapsed\s*>\s*\.toc-content\s*{[^}]*grid-template-rows:\s*0fr;/,
  )
})

test('TOC collapse keeps its top edge fixed and animates content upward', () => {
  const css = readFileSync(
    new URL('../src/content/style/toc.css', import.meta.url),
    'utf8',
  )
  const uiSource = readFileSync(
    new URL('../src/content/ui/index.ts', import.meta.url),
    'utf8',
  )

  assert.match(
    css,
    /#smarttoc\s*>\s*\.toc-content\s*{[^}]*grid-template-rows:\s*1fr;[^}]*transition:\s*grid-template-rows 0\.2s ease;/,
  )
  assert.match(uiSource, /getBoundingClientRect\(\)\.top/)
  assert.match(uiSource, /bottom:\s*'auto'/)
  assert.match(uiSource, /m\(\s*'\.toc-content'/)
})

test('TOC opacity only changes the theme background', () => {
  const css = readFileSync(
    new URL('../src/content/style/toc.css', import.meta.url),
    'utf8',
  )
  const uiSource = readFileSync(
    new URL('../src/content/ui/index.ts', import.meta.url),
    'utf8',
  )
  const contentSource = readFileSync(
    new URL('../src/content/index.ts', import.meta.url),
    'utf8',
  )

  assert.match(
    css,
    /--smarttoc-bg:\s*rgba\(255, 255, 255, var\(--smarttoc-opacity\)\)/,
  )
  assert.match(
    css,
    /--smarttoc-bg:\s*rgba\(17, 24, 39, var\(--smarttoc-opacity\)\)/,
  )
  assert.match(
    uiSource,
    /'--smarttoc-opacity':\s*String\(opacity \/ 100\)/,
  )
  assert.match(contentSource, /const settingKeys = \[[^\]]*'opacity'/)
})
