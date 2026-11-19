import clsx from 'clsx'
import { useIsWideScreen } from '../../app/viewport.js'
import { refreshBalance, useBalanceStore, useBalanceSync } from '../../services/balance.js'
import { useSettings } from '../../services/settings.js'
import styles from './BalanceBadge.module.css'

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
}

/** 余额接口返回两位小数字符串，统一按当前语言的数字格式展示，并补上币种符号 */
const formatAmount = (value: string, currency: string, locale: string): string => {
  const amount = Number(value)
  const formatted = Number.isFinite(amount)
    ? new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    : value
  return `${CURRENCY_SYMBOLS[currency] ?? `${currency} `}${formatted}`
}

/** 右下角常驻的已充值余额；窄于 1200px 时隐藏 */
export const BalanceBadge = () => {
  const isWide = useIsWideScreen()
  const apiKey = useSettings((state) => state.apiKey)
  const locale = useSettings((state) => state.locale)
  useBalanceSync(isWide)
  const data = useBalanceStore((state) => state.data)
  const status = useBalanceStore((state) => state.status)

  if (!isWide || !apiKey) {
    return null
  }

  const infos = data?.balance_infos ?? []
  const amount =
    infos.length > 0
      ? infos.map((info) => formatAmount(info.topped_up_balance, info.currency, locale)).join(' · ')
      : status === 'loading'
        ? '…'
        : '—'

  return (
    <div className={styles.badge}>
      <button
        type="button"
        className={clsx(styles.button, status === 'error' && styles.error)}
        aria-label={amount}
        onClick={() => void refreshBalance()}
      >
        <span className={styles.amount}>{amount}</span>
      </button>
    </div>
  )
}
