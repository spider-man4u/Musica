import { supabase } from "./supabase"

export interface AdminNotification {
  id: string
  title: string
  message: string
  notification_type: "notification" | "popup" | "changelog" | "update"
  style?: {
    bgColor?: string
    textColor?: string
    icon?: string
    action_url?: string
    action_label?: string
  }
  targetUsers?: string[] | "all"
  scheduled_at?: string
  published_at?: string
  expires_at?: string
  is_active: boolean
  created_at: string
}

export interface AdminUser {
  id: string
  user_id: string
  email: string
  role: "admin" | "moderator" | "support"
  permissions: {
    send_notifications: boolean
    send_updates: boolean
    send_popups: boolean
    manage_users: boolean
  }
}

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from("admin_users").select("id").eq("user_id", userId).single()

    if (error || !data) return false
    return true
  } catch {
    return false
  }
}

export const getAdminInfo = async (userId: string): Promise<AdminUser | null> => {
  try {
    const { data, error } = await supabase.from("admin_users").select("*").eq("user_id", userId).single()

    if (error) return null
    return data as AdminUser
  } catch {
    return null
  }
}

export const createNotification = async (
  adminId: string,
  notification: Omit<AdminNotification, "id" | "created_at">,
) => {
  try {
    const { data, error } = await supabase
      .from("admin_notifications")
      .insert({
        admin_id: adminId,
        title: notification.title,
        message: notification.message,
        notification_type: notification.notification_type,
        style: notification.style || {},
        target_users: Array.isArray(notification.targetUsers)
          ? notification.targetUsers
          : notification.targetUsers === "all"
            ? ["all"]
            : [],
        scheduled_at: notification.scheduled_at,
        published_at: new Date().toISOString(),
        expires_at: notification.expires_at,
        is_active: notification.is_active ?? true,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err: any) {
    console.error("Create notification error:", err)
    return { success: false, error: err?.message }
  }
}

export const getActiveNotifications = async (userId: string) => {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("admin_notifications")
      .select(
        `
      *,
      user_notifications!left(id, seen_at, dismissed_at)
    `,
      )
      .eq("is_active", true)
      .lte("published_at", now)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order("published_at", { ascending: false })

    if (error) throw error

    const userNotifications = data.filter((n: any) => {
      const targets = n.target_users || []
      return targets.includes("all") || targets.includes(userId)
    })

    return { success: true, data: userNotifications }
  } catch (err: any) {
    console.error("Get notifications error:", err)
    return { success: false, data: [], error: err?.message }
  }
}

export const markNotificationSeen = async (userId: string, notificationId: string) => {
  try {
    const { error } = await supabase.from("user_notifications").upsert({
      user_id: userId,
      notification_id: notificationId,
      seen_at: new Date().toISOString(),
    })

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error("Mark seen error:", err)
    return { success: false, error: err?.message }
  }
}

export const updateNotificationStatus = async (notificationId: string, isActive: boolean) => {
  try {
    const { error } = await supabase
      .from("admin_notifications")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", notificationId)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error("Update notification error:", err)
    return { success: false, error: err?.message }
  }
}
