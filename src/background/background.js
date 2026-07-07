importScripts('settings.js')

const settings = SmartTocSettings
const RESET_POSITION_MENU_ID = 'position_menu'
const DISABLE_DOMAIN_MENU_ID = 'disable_domain_menu'

const getCurrentTab = (cb) => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
    cb(activeTab)
  })
}

const isExtensionPage = (url) => {
  return /^(chrome|edge|about|moz-extension|chrome-extension):/.test(url || '')
}

const setActionIcon = (tabId, path) => {
  chrome.action.setIcon({
    tabId,
    path,
  })
}

const unloadTab = (tab) => {
  if (!tab || !tab.id) {
    return
  }

  chrome.tabs.sendMessage(tab.id, 'unload', {}, () => {
    setActionIcon(tab.id, 'icon_gray.png')
  })
}

const withSettings = (callback) => {
  chrome.storage.local.get(settings.DEFAULT_TOC_SETTINGS, (items) => {
    callback(settings.normalizeTocSettings(items))
  })
}

const isTabDisabled = (tab, options) => {
  return settings.isDomainDisabled(tab.url || '', options.disabledDomains)
}

const execOnCurrentTab = (command) => {
  getCurrentTab((tab) => {
    if (!tab || !tab.id || isExtensionPage(tab.url)) {
      return
    }

    withSettings((options) => {
      if (isTabDisabled(tab, options)) {
        unloadTab(tab)
        return
      }

      chrome.tabs.sendMessage(tab.id, command, {}, (response) => {
        if (!chrome.runtime.lastError) {
          return
        }

        if (command === 'toggle' && response === undefined) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id, allFrames: true },
              files: ['toc.js'],
            },
            () => {
              chrome.tabs.sendMessage(tab.id, command, {}, () => {})
            },
          )
        }
      })
    })
  })
}

const createContextMenus = () => {
  chrome.contextMenus.create({
    id: RESET_POSITION_MENU_ID,
    title: 'Reset TOC Position',
    type: 'normal',
    contexts: ['action'],
  })

  chrome.contextMenus.create({
    id: DISABLE_DOMAIN_MENU_ID,
    title: 'Disable Smart TOC on this domain / 加入負面網站清單',
    type: 'normal',
    contexts: ['action', 'page'],
  })
}

const addTabDomainToDisabledList = (tab) => {
  if (!tab || !tab.url || isExtensionPage(tab.url)) {
    return
  }

  const domain = settings.normalizeDomain(tab.url)
  if (!domain) {
    return
  }

  withSettings((options) => {
    const disabledDomains = settings.normalizeDisabledDomains(options.disabledDomains)
    if (!disabledDomains.includes(domain)) {
      disabledDomains.push(domain)
    }

    chrome.storage.local.set({ disabledDomains }, () => {
      unloadTab(tab)
    })
  })
}

chrome.action.onClicked.addListener(() => execOnCurrentTab('toggle'))
chrome.commands.onCommand.addListener((command) => execOnCurrentTab(command))

chrome.runtime.onInstalled.addListener(async (details) => {
  chrome.contextMenus.removeAll(createContextMenus)

  if (details.reason === 'install') {
    const url = chrome.runtime.getURL('options.html')
    await chrome.tabs.create({ url })
  }
})

chrome.contextMenus.onClicked.addListener((item, tab) => {
  if (item.menuItemId === RESET_POSITION_MENU_ID) {
    if (chrome.storage) {
      chrome.storage.local.set({ smarttoc_offset: { x: 0, y: 0 } })
      execOnCurrentTab('refresh')
    }
    return
  }

  if (item.menuItemId === DISABLE_DOMAIN_MENU_ID) {
    addTabDomainToDisabledList(tab)
  }
})

chrome.action.setIcon({
  path: 'icon_gray.png',
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const tabId = sender.tab && sender.tab.id

  if (tabId) {
    if (request === 'unload') {
      setActionIcon(tabId, 'icon_gray.png')
    } else if (request === 'load') {
      setActionIcon(tabId, 'icon.png')
    }
  }

  sendResponse(true)
})
