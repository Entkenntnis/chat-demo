import type { Session } from '../../services/chat/types.js'
import { ChatInput } from '../chatInput/ChatInput.js'
import { MessageList } from '../messages/MessageList.js'
import styles from './SessionView.module.css'

/** 会话页：消息列表，输入框吸底 */
export const SessionView = ({
  session,
  streaming,
}: {
  session: Session
  streaming: boolean
}) => {
  return (
    <div className={styles.view}>
      <MessageList
        session={session}
        streaming={streaming}
        footer={
          <div className={styles.inputContainer}>
            <ChatInput sessionId={session.id} />
          </div>
        }
      />
    </div>
  )
}
