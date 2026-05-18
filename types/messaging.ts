export type MessageType = 'intro' | 'reply'

export type UserStatus = 'happy_to_help' | 'need_guidance' | 'just_training'

export type Thread = {
  id: string
  user_1: string
  user_2: string
  initiated_by: string
  origin_checkin_id: string | null
  created_at: string
  unlocked_at: string | null
  latest_message_at: string
  unread_count_user_1: number
  unread_count_user_2: number
}

export type ThreadWithMeta = Thread & {
  other_user_id: string
  other_user_name: string
  other_user_status: UserStatus | null
  other_user_active: boolean
  intro_preview: string
  unread_count: number
}

export type Message = {
  id: string
  thread_id: string
  sender_id: string
  body: string
  created_at: string
  message_type: MessageType
}
