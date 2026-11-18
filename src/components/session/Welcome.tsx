import { useIsMobile } from '../../app/viewport.js'
import { ChatInput } from '../chatInput/ChatInput.js'
import { MobileHeader } from './MobileHeader.js'
import styles from './Welcome.module.css'

/** 新对话：输入框。桌面端居中；移动端输入框吸底 */
export const Welcome = () => {
  const isMobile = useIsMobile()
  return (
    <div className={styles.container}>
      {isMobile ? <MobileHeader /> : null}
      <div className={styles.welcome}>
        <ChatInput sessionId={null} />
      </div>
    </div>
  )
}
