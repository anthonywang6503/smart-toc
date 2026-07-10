const settings = SmartTocSettings

const getElement = (id) => document.getElementById(id)

const getCheckedValue = (name) => {
  const checked = document.querySelector(`input[name="${name}"]:checked`)
  return checked ? checked.value : undefined
}

const setStatus = (message) => {
  const status = getElement('status')
  status.textContent = message
  setTimeout(() => {
    status.textContent = ''
  }, 5000)
}

const readForm = () => {
  return settings.normalizeTocSettings({
    autoType: getCheckedValue('auto'),
    isShowTip: getElement('show-tip').checked,
    isRememberPos: getElement('remember-pos').checked,
    selectorInoreader: getElement('selector-inoreader').value,
    selectorFeedly: getElement('selector-feedly').value,
    theme: getCheckedValue('theme'),
    fontSize: getElement('font-size').value,
    opacity: getElement('opacity').value,
    disabledDomains: getElement('disabled-domains').value,
  })
}

const writeForm = (storedSettings) => {
  const options = settings.normalizeTocSettings(storedSettings)

  getElement('show-tip').checked = options.isShowTip
  getElement('remember-pos').checked = options.isRememberPos
  getElement(`auto-${options.autoType}`).checked = true
  getElement(`theme-${options.theme}`).checked = true
  getElement('font-size').value = String(options.fontSize)
  getElement('opacity').value = String(options.opacity)
  getElement('opacity-value').textContent = String(options.opacity)
  getElement('selector-inoreader').value = options.selectorInoreader
  getElement('selector-feedly').value = options.selectorFeedly
  getElement('disabled-domains').value = options.disabledDomains.join('\n')
}

const save_options = () => {
  const options = readForm()

  chrome.storage.local.set(options, () => {
    writeForm(options)
    setStatus('Options saved. / 已保存。')
  })
}

const restore_options = () => {
  chrome.storage.local.get(settings.DEFAULT_TOC_SETTINGS, (items) => {
    writeForm(items)
  })
}

const reset_options = () => {
  chrome.storage.local.clear(() => {
    restore_options()
    setStatus('Options reset. / 已重設。')
  })
}

document.addEventListener('DOMContentLoaded', () => {
  restore_options()

  getElement('opacity').addEventListener('input', (event) => {
    getElement('opacity-value').textContent = event.target.value
  })

  document.querySelectorAll('input, textarea').forEach((input) => {
    input.addEventListener('change', save_options)
  })

  getElement('btnReset').addEventListener('click', reset_options)
})
