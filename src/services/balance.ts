import { useEffect } from 'react'
import { create } from 'zustand'
import { fetchBalance } from './api/client.js'
import type { UserBalance } from './api/types.js'
import { useChatStore } from './chat/store.js'
import { useSettings } from './settings.js'

/** 可见时定时刷新余额的间隔 */
const REFRESH_INTERVAL = 60_000

type BalanceState = {
  data: UserBalance | null
  status: 'idle' | 'loading' | 'ok' | 'error'
  /** 数据所属的 API Key，切换账号时避免显示上一个账号的余额 */
  key: string | null
  updatedAt: number | null
}

export const useBalanceStore = create<BalanceState>(() => ({
  data: null,
  status: 'idle',
  key: null,
  updatedAt: null,
}))

let controller: AbortController | null = null
let activeKey: string | null = null

const cancelRequest = () => {
  controller?.abort()
  controller = null
  activeKey = null
}

/** 读取余额：同一 Key 的请求未结束时复用，切换 Key 时中止旧请求；失败时保留上次的数据 */
export const refreshBalance = async (): Promise<void> => {
  const apiKey = useSettings.getState().apiKey
  if (!apiKey) {
    cancelRequest()
    useBalanceStore.setState({ data: null, status: 'idle', key: null, updatedAt: null })
    return
  }
  if (controller && activeKey === apiKey) {
    return
  }
  cancelRequest()
  const current = new AbortController()
  controller = current
  activeKey = apiKey
  useBalanceStore.setState((state) => ({
    data: state.key === apiKey ? state.data : null,
    status: 'loading',
    key: apiKey,
  }))
  try {
    const data = await fetchBalance(apiKey, current.signal)
    if (controller !== current) {
      return
    }
    useBalanceStore.setState({ data, status: 'ok', key: apiKey, updatedAt: Date.now() })
  } catch {
    if (current.signal.aborted || controller !== current) {
      return
    }
    useBalanceStore.setState({ status: 'error' })
  } finally {
    if (controller === current) {
      controller = null
      activeKey = null
    }
  }
}

/**
 * 跟随 API Key 启停余额刷新：切换 Key 时立即读取，之后每 60 秒（仅页面可见时）、
 * 窗口重新获得焦点或助手回复结束时刷新。enabled 为 false 时（移动端）不发起请求。
 */
export const useBalanceSync = (enabled = true) => {
  const apiKey = useSettings((state) => state.apiKey)

  useEffect(() => {
    if (!apiKey) {
      cancelRequest()
      useBalanceStore.setState({ data: null, status: 'idle', key: null, updatedAt: null })
      return
    }
    if (!enabled) {
      cancelRequest()
      return
    }
    void refreshBalance()

    let lastStreamingCount = Object.keys(useChatStore.getState().streaming).length
    const unsubscribeStreaming = useChatStore.subscribe((state) => {
      const count = Object.keys(state.streaming).length
      if (lastStreamingCount > 0 && count === 0) {
        void refreshBalance()
      }
      lastStreamingCount = count
    })

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshBalance()
      }
    }
    const timer = setInterval(refreshIfVisible, REFRESH_INTERVAL)
    document.addEventListener('visibilitychange', refreshIfVisible)
    window.addEventListener('focus', refreshIfVisible)

    return () => {
      clearInterval(timer)
      unsubscribeStreaming()
      document.removeEventListener('visibilitychange', refreshIfVisible)
      window.removeEventListener('focus', refreshIfVisible)
      cancelRequest()
    }
  }, [apiKey, enabled])
}
