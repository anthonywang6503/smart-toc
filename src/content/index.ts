import { extractArticle, extractHeadings } from './lib/extract'
import { getContentWindow } from './lib/iframe'
import {
  DEFAULT_TOC_SETTINGS,
  isDomainDisabled,
  normalizeTocSettings,
  TocSettings,
} from './settings'
import { createToc, Toc, TocPreference } from './toc'
import { isDebugging, offsetKey } from './util/env'
import { showToast } from './util/toast'

function setPreference(
  preference: TocPreference,
  callback?: (isEnabled: boolean, settings: TocSettings) => void,
) {
  const applySettings = (result: Record<string, any>) => {
    const settings = normalizeTocSettings(result)
    const offset = result[offsetKey] || { x: 0, y: 0 }

    preference.isRememberPos = settings.isRememberPos
    preference.theme = settings.theme
    preference.fontSize = settings.fontSize

    if (settings.isRememberPos) {
      preference.offset.x = offset.x
      preference.offset.y = offset.y
    }
    else {
      preference.offset.x = 0
      preference.offset.y = 0
    }

    if (callback) {
      callback(
        !isDomainDisabled(window.location.hostname, settings.disabledDomains),
        settings,
      )
    }
  }

  if (chrome.storage && chrome.storage.local) {
    const defaultOptions: Record<string, any> = {
      ...DEFAULT_TOC_SETTINGS,
      [offsetKey]: { x: 0, y: 0 },
    }
    chrome.storage.local.get(defaultOptions, applySettings)
  }
  else if(callback){
    applySettings(DEFAULT_TOC_SETTINGS)
  }
}

if (window === getContentWindow()) {
  let currentSettings: TocSettings = DEFAULT_TOC_SETTINGS
  let preference: TocPreference = {
    offset: { x: 0, y: 0 },
    isRememberPos: DEFAULT_TOC_SETTINGS.isRememberPos,
    theme: DEFAULT_TOC_SETTINGS.theme,
    fontSize: DEFAULT_TOC_SETTINGS.fontSize,
  }
  let isLoad = false;
  let isNewArticleDetected = true

  let toc: Toc | undefined

  const start = (): void => {
    const article = extractArticle(currentSettings)
    const headings = article && extractHeadings(article)
    renderToc(article,headings)
  }

  const renderToc = (article, headings): void => {
    if (toc) {
      toc.dispose()
    }

    if (!(article && headings && headings.length)) {
      if(currentSettings.isShowTip){
        showToast('No article/headings are detected.')
      }
      return
    }

    isNewArticleDetected = true

    toc = createToc({
      article,
      preference,
    })
    toc.on('error', (error) => {
      if (toc) {
        toc.dispose()
        toc = undefined
      }
      // re-extract && restart
      // start()
    })
    toc.show()
  } 

  chrome.runtime.onMessage.addListener(
    (request: 'toggle' | 'prev' | 'next' | 'refresh' | 'load' | 'unload', sender, sendResponse) => {
      if(request === 'unload'){
        unload()
        sendResponse(true)
        return
      }
      if(request === 'load'){
        load()
        sendResponse(true)
        return true
      }
      try {
        setPreference(preference, (isEnabled, settings) => {
          currentSettings = settings
          if (!isEnabled) {
            unload()
            sendResponse(true)
            return
          }

          if (!isLoad || request === 'refresh') {
            loadCurrentSettings()
          } else {
            if(toc){
              toc[request]()
            }
            if(isLoad && request === 'toggle'){
              unload()
            }
          }

          sendResponse(true)
        })
      } catch (e) {
        console.error(e)
        sendResponse(false)
      }
      return true
    },
  )

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return
    }

    const settingKeys = [
      'disabledDomains',
      'theme',
      'fontSize',
      'isRememberPos',
      'selectorInoreader',
      'selectorFeedly',
      'isShowTip',
    ]
    if (!settingKeys.some((key) => changes[key])) {
      return
    }

    setPreference(preference, (isEnabled, settings) => {
      currentSettings = settings
      if (!isEnabled) {
        unload()
        return
      }

      if (isLoad) {
        start()
      }
    })
  })

  let observer:any = null;
  let timeoutTrack: any = null;

  function domListener() {
    var MutationObserver =
      window.MutationObserver || window.WebKitMutationObserver
    if (typeof MutationObserver !== 'function') {
      console.error(
        'DOM Listener Extension: MutationObserver is not available in your browser.',
      )
      return
    }

    let domChangeCount = 0;
    const callback = function (mutationsList, observer) {
      clearInterval(timeoutTrack);
      domChangeCount++;
      let intervalCount=0;
      timeoutTrack = setInterval(() => {
        intervalCount++;
        if(intervalCount === 4){ // 最多检测次数
          clearInterval(timeoutTrack)
        }
        if(isDebugging){
          console.log({domChangeCount});
        }
        domChangeCount = 0;
        if(intervalCount == 1){
          setPreference(preference, (isEnabled, settings) => {
            currentSettings = settings
            if (isEnabled) {
              trackArticle()
            } else {
              unload()
            }
          })
        }
        else if(intervalCount > 1 && !isNewArticleDetected){
          detectToc()
        }
      }, 300);
    }

    if(observer === null){
      observer = new MutationObserver(callback)
    }
    else {
      observer.disconnect()
    }

     const config = {
      attributes: true, attributeOldValue: true, subtree: true,
      childList: true
    }
    observer.observe(document, config)
  }

  let articleId = ''
  let articleContentClass = ''
  function trackArticle() {
    const articleClass = isFeedly
      ? currentSettings.selectorFeedly
      : currentSettings.selectorInoreader;
    const el: HTMLElement = document.querySelector(articleClass) as HTMLElement;
    let isArticleChanged = (el && (el.id !== articleId || el.className !== articleContentClass)) || (!el && articleId !== '')
    if (isArticleChanged) {
      isNewArticleDetected = false
      if (isDebugging) {
        console.log('refresh')
        console.log(el)
      }
      articleId = el ? el.id : ''
      articleContentClass = el ? el.className : ''
      start()
    }
  }

  function detectToc(){
    const article = extractArticle(currentSettings)
    const headings = article && extractHeadings(article)
    if (article && headings && headings.length>0){
      renderToc(article, headings)
      clearInterval(timeoutTrack)
    }
  }

  const dm = document.domain
  const isInoReader =
    dm.indexOf('inoreader.com') >= 0 || dm.indexOf('innoreader.com') > 0
  const isFeedly = dm.indexOf('feedly.com') >= 0

  // auto load
  setPreference(preference, (isEnabled, settings) => {
    currentSettings = settings
    if(isEnabled && settings.autoType!=='0'){ // not disabled
      let isAutoLoad = settings.autoType === '1'; // all page
      if (settings.autoType === '2') { // rss web app
        const dm = document.domain
        const isInoReader =
          dm.indexOf('inoreader.com') >= 0 || dm.indexOf('innoreader.com') > 0
        const isFeedly = dm.indexOf('feedly.com') >= 0
        isAutoLoad = isInoReader || isFeedly;
      }
  
      if(isAutoLoad){
        load();
      }
    }
  });

  function load(){
    setPreference(preference, (isEnabled, settings) => {
      currentSettings = settings
      if (!isEnabled) {
        unload()
        return
      }
      loadCurrentSettings()
    })
  }

  function loadCurrentSettings(){
    chrome.runtime.sendMessage("load")
    isLoad = true
    start();
    if (isInoReader || isFeedly) {
      domListener()
    }
  }

  function unload(){
    chrome.runtime.sendMessage("unload")
    isLoad = false
    if (toc) {
      toc.dispose()
    }
    if(observer !== null){
      observer.disconnect()
      observer = null
    }
  }
  
}
