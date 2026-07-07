import {
  createDecorator,
  AnyFunction,
  decorateObject,
  Decorator,
} from './decorator'

export const createLogger = (name: string) => (...args: any[]) => {
  console.info(`[${name}]`, ...args)
}

/**
 * 記錄函式呼叫與回傳
 *
 * 建立一個裝飾器，裝飾後的 fn 會記錄呼叫參數與回傳結果
 */
export const createLoggingDecorator = <T extends AnyFunction>(
  name: string,
  self: any = null,
): Decorator<T> => {
  const logger = createLogger(name)
  const decorator = createDecorator<T>({
    onCalled(params) {
      // @ts-ignore
      logger(...params)
    },
    onReturned(result) {
      logger(result)
    },
    onError(error) {
      logger(` <ERROR> `)
      console.error(error)
    },
  })
  return decorator
}

/**
 * 記錄物件各個方法的呼叫情況
 * 並新增到 window.logged.* 上
 */
export const logObject = <T extends { [K: string]: any }>(object: T, namespace: string): T => {
  const loggers = {} as any
  const getLogger = (fnName: string) => {
    if (!loggers[fnName]) {
      loggers[fnName] = createLogger(`${namespace}:${fnName}`)
    }
    return loggers[fnName]
  }
  const loggedObject = decorateObject<T>(object, {
    onCalled(params, fnName) {
      getLogger(fnName)(...params)
    },
    onReturned(result, params, fnName) {
      getLogger(fnName)(result)
    },
    onError(error, params, fnName) {
      getLogger(fnName)(` <ERROR> `)
      console.error(error)
    },
  })

  // @ts-ignore
  if (typeof window !== 'undefined') {
    // @ts-ignore
    const w = window as any
    if (!w.logged) {
      w.logged = {}
    }
    w.logged[namespace] = object
  }
  return loggedObject
}
