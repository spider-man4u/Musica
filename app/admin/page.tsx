"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Edit2,
  Trash2,
  Clock,
  Users,
  MessageSquare,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { getCurrentUser } from "@/lib/supabase"
import { checkIsAdmin, getActiveNotifications, createNotification } from "@/lib/admin"
import { Textarea } from "@/components/ui/textarea"

interface NotificationForm {
  title: string
  message: string
  type: "notification" | "popup" | "changelog" | "update"
  expiresIn: number // hours
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("send")
  const [notifications, setNotifications] = useState<any[]>([])
  const [form, setForm] = useState<NotificationForm>({
    title: "",
    message: "",
    type: "notification",
    expiresIn: 24,
  })
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { userData } = useStore()

  useEffect(() => {
    const initAdmin = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/")
          return
        }

        setUser(currentUser)

        // Check if user is admin
        const adminCheck = await checkIsAdmin(currentUser.id)
        if (!adminCheck) {
          console.log("User is not an admin")
          router.push("/")
          return
        }

        setIsAdmin(true)

        // Load notifications
        const { data: notifs } = await getActiveNotifications(currentUser.id)
        if (notifs) {
          setNotifications(notifs)
        }
      } catch (err) {
        console.error("Admin init error:", err)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    initAdmin()
  }, [router])

  const handleSendNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setError("Title and message are required")
      return
    }

    setSending(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await createNotification(user.id, {
        title: form.title,
        message: form.message,
        notification_type: form.type,
        is_active: true,
        targetUsers: "all",
        expires_at: new Date(Date.now() + form.expiresIn * 60 * 60 * 1000).toISOString(),
        style: {
          bgColor: form.type === "changelog" ? "from-blue-500 to-blue-600" : "from-purple-500 to-blue-500",
          icon: form.type === "changelog" ? "package" : "bell",
        },
      })

      if (result.success) {
        setSuccess(true)
        setForm({ title: "", message: "", type: "notification", expiresIn: 24 })
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || "Failed to send notification")
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred")
    } finally {
      setSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/80">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading admin panel...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-red-500/10 border border-red-500/30">
          <CardContent className="p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Access Denied</h2>
              <p className="text-white/70">You don't have permission to access the admin panel.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/60">Manage notifications, updates, and system messages</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-white/20 mb-6">
            <TabsTrigger value="send" className="data-[state=active]:bg-white data-[state=active]:text-purple-900">
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:text-purple-900">
              <Bell className="w-4 h-4 mr-2" />
              Active Messages
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-purple-900">
              <Zap className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Send Notification Tab */}
          <TabsContent value="send">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Send Notification</CardTitle>
                <CardDescription>Create and broadcast a message to all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Type Selection */}
                <div>
                  <Label className="text-white mb-3 block">Message Type</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["notification", "popup", "update", "changelog"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setForm({ ...form, type })}
                        className={`p-4 rounded-lg border-2 transition-all text-sm font-medium capitalize ${
                          form.type === type
                            ? "border-purple-400 bg-purple-500/20 text-purple-300"
                            : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {type === "notification" && <Bell className="w-4 h-4 mx-auto mb-2" />}
                        {type === "popup" && <AlertCircle className="w-4 h-4 mx-auto mb-2" />}
                        {type === "update" && <Zap className="w-4 h-4 mx-auto mb-2" />}
                        {type === "changelog" && <MessageSquare className="w-4 h-4 mx-auto mb-2" />}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-white mb-2 block">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Notification title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message" className="text-white mb-2 block">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Write your message here..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
                  />
                </div>

                {/* Expires In */}
                <div>
                  <Label htmlFor="expires" className="text-white mb-2 block">
                    Expires In (hours)
                  </Label>
                  <Input
                    id="expires"
                    type="number"
                    min="1"
                    value={form.expiresIn}
                    onChange={(e) => setForm({ ...form, expiresIn: Number.parseInt(e.target.value) || 24 })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                {/* Status Messages */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-red-400">{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-start gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-green-400">Message sent successfully!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Send Button */}
                <Button
                  onClick={handleSendNotification}
                  disabled={sending}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-medium"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send to All Users
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Messages Tab */}
          <TabsContent value="active">
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                  <CardContent className="p-12 text-center">
                    <Bell className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">No active messages</p>
                  </CardContent>
                </Card>
              ) : (
                notifications.map((notif, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-400/30 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2">{notif.title}</h3>
                            <p className="text-white/70 mb-4">{notif.message}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-white/60">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(notif.published_at).toLocaleDateString()}
                            </span>
                            <span className="capitalize px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {notif.notification_type}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Message Analytics</CardTitle>
                <CardDescription>Track your message performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Messages", value: notifications.length, icon: MessageSquare },
                    { label: "Active Users", value: "12,456", icon: Users },
                    { label: "Total Notifications", value: "54,891", icon: Bell },
                    { label: "Avg. Response", value: "3.2h", icon: Clock },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col items-center text-center"
                    >
                      <stat.icon className="w-8 h-8 text-purple-400 mb-3" />
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/60 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
