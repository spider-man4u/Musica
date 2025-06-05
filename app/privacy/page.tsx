"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PrivacyPage() {
  const privacySections = [
    {
      icon: Database,
      title: "Data Collection",
      content:
        "We collect minimal data necessary to provide our music streaming service, including your listening preferences, playlists, and basic account information.",
    },
    {
      icon: Eye,
      title: "How We Use Your Data",
      content:
        "Your data helps us personalize your music experience, recommend songs you might like, and improve our service quality.",
    },
    {
      icon: Lock,
      title: "Data Security",
      content:
        "We use industry-standard encryption and security measures to protect your personal information and listening data.",
    },
    {
      icon: UserCheck,
      title: "Your Rights",
      content:
        "You have the right to access, modify, or delete your personal data at any time through your account settings.",
    },
    {
      icon: Shield,
      title: "Third-Party Services",
      content:
        "We may use third-party services for music streaming and analytics, but we never sell your personal data to advertisers.",
    },
    {
      icon: AlertTriangle,
      title: "Data Retention",
      content: "We retain your data only as long as necessary to provide our services or as required by law.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8 pt-8">
          <Link href="/profile">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <ArrowLeft className="w-6 h-6 text-white mr-4" />
            </motion.div>
          </Link>
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        </div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Your Privacy Matters</h2>
          <p className="text-gray-300 leading-relaxed">
            At Musica, we are committed to protecting your privacy and ensuring transparency about how we collect, use,
            and protect your personal information. This privacy policy explains our practices and your rights regarding
            your data.
          </p>
        </motion.div>

        {/* Privacy Sections */}
        <div className="space-y-6">
          {privacySections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <section.icon className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{section.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{section.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mt-8 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Questions About Privacy?</h3>
          <p className="text-gray-300 mb-4">
            If you have any questions about this privacy policy or how we handle your data, please don't hesitate to
            contact us.
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">Contact Support</Button>
        </motion.div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-gray-400 text-sm">Last updated: December 2024</div>
      </div>
    </div>
  )
}
