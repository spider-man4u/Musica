"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Search, ChevronDown, ChevronUp, MessageCircle, Mail, Phone, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const faqs = [
    {
      question: "How do I create a playlist?",
      answer:
        "To create a playlist, go to your Library, click the '+' button, and select 'Create Playlist'. You can then add songs by clicking the '+' icon next to any song.",
    },
    {
      question: "Why can't I play some songs?",
      answer:
        "Some songs may not be available due to licensing restrictions in your region, or the audio file may be temporarily unavailable. Try refreshing the page or searching for an alternative version.",
    },
    {
      question: "How do I download songs for offline listening?",
      answer:
        "Premium users can download songs by clicking the download icon next to any song or playlist. Downloaded songs will be available in your Downloads section.",
    },
    {
      question: "How do I change my account settings?",
      answer:
        "Go to your Profile page and click on Settings. From there, you can update your personal information, notification preferences, and audio quality settings.",
    },
    {
      question: "What audio quality options are available?",
      answer:
        "Musica offers three audio quality options: High (320kbps), Medium (160kbps), and Low (96kbps). You can change this in your Settings under Audio Quality.",
    },
    {
      question: "How do I report a problem with a song?",
      answer:
        "If you encounter issues with a specific song, click the three dots menu next to the song and select 'Report Issue'. Provide details about the problem you're experiencing.",
    },
    {
      question: "Can I share my playlists with friends?",
      answer:
        "Yes! You can share playlists by clicking the share icon on any playlist. You can copy the link or share directly to social media platforms.",
    },
    {
      question: "How do I cancel my subscription?",
      answer:
        "To cancel your subscription, go to Settings > Account > Subscription and click 'Cancel Subscription'. Your premium features will remain active until the end of your billing period.",
    },
  ]

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Contact form submitted:", contactForm)
    // Reset form
    setContactForm({ name: "", email: "", subject: "", message: "" })
    alert("Thank you for your message! We'll get back to you soon.")
  }

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
          <h1 className="text-3xl font-bold text-white">Help & Support</h1>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center"
          >
            <MessageCircle className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Live Chat</h3>
            <p className="text-gray-400 text-sm mb-4">Get instant help from our support team</p>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              Start Chat
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center"
          >
            <Mail className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Email Support</h3>
            <p className="text-gray-400 text-sm mb-4">Send us a detailed message</p>
            <Button size="sm" variant="outline" className="border-white/20 text-white">
              Send Email
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center"
          >
            <Phone className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Phone Support</h3>
            <p className="text-gray-400 text-sm mb-4">Call us for urgent issues</p>
            <Button size="sm" variant="outline" className="border-white/20 text-white">
              Call Now
            </Button>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10"
        >
          <div className="flex items-center mb-6">
            <HelpCircle className="w-6 h-6 text-purple-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">Frequently Asked Questions</h2>
          </div>

          {/* Search FAQs */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="border border-white/10 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-4 text-left bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span className="text-white font-medium">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-white/5 border-t border-white/10">
                        <p className="text-gray-300">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Still Need Help?</h2>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Name</label>
                <Input
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">Subject</label>
              <Input
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="What can we help you with?"
                required
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">Message</label>
              <Textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[120px]"
                placeholder="Please describe your issue in detail..."
                required
              />
            </div>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
              Send Message
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
