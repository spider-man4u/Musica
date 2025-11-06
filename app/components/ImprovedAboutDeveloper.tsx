"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Github, Linkedin, Mail, Twitter, Code2, Zap, Heart } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface ImprovedAboutDeveloperProps {
  onSkip?: () => void
  showSkipButton?: boolean
}

export default function ImprovedAboutDeveloper({ onSkip, showSkipButton = true }: ImprovedAboutDeveloperProps) {
  const router = useRouter()

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      router.push("/")
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          >
            Musica
          </motion.h1>
          {showSkipButton && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              onClick={handleSkip}
              className="text-white/70 hover:text-white transition-all duration-300 text-sm font-medium"
            >
              Skip
            </motion.button>
          )}
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row gap-8 items-center">
                {/* Developer Avatar */}
                <motion.div variants={itemVariants} className="relative flex-shrink-0">
                  <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-purple-400/30 shadow-xl hover:border-purple-400/60 hover:shadow-2xl transition-all duration-500">
                    <Image
                      src="/developer-portrait.png"
                      alt="Ali Sheikh - Full Stack Developer"
                      width={160}
                      height={160}
                      priority
                      className="object-cover w-full h-full hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-3 shadow-lg"
                  >
                    <Code2 className="w-6 h-6 text-white" />
                  </motion.div>
                </motion.div>

                {/* Developer Info */}
                <motion.div variants={itemVariants} className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">Ali Sheikh</h2>
                  <p className="text-purple-400 font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    Full-Stack Developer & Music Enthusiast
                  </p>
                  <p className="text-white/80 leading-relaxed mb-6">
                    With 5+ years of web development experience and a lifelong passion for music, I created Musica to
                    combine technology and art. This project represents my vision for how music streaming should be:
                    intuitive, powerful, and user-centric.
                  </p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <p className="text-2xl font-bold text-purple-400">5+</p>
                      <p className="text-xs text-white/60">Years Exp.</p>
                    </motion.div>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <p className="text-2xl font-bold text-blue-400">50+</p>
                      <p className="text-xs text-white/60">Projects</p>
                    </motion.div>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <p className="text-2xl font-bold text-pink-400">∞</p>
                      <p className="text-xs text-white/60">Music Love</p>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: "Performance", desc: "Fast, smooth, optimized" },
              { icon: Heart, title: "Passion", desc: "Love for great music" },
              { icon: Code2, title: "Quality", desc: "Clean, maintainable code" },
            ].map((item, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 h-full hover:border-purple-400/30 transition-colors">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-white/60">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-white mb-6">Connect & Support</h3>
              <div className="space-y-4">
                {[
                  {
                    icon: Mail,
                    label: "Email",
                    value: "your.spider0@gmail.com",
                    href: "mailto:your.spider0@gmail.com",
                  },
                  { icon: Github, label: "GitHub", value: "github.com/spider", href: "#" },
                  { icon: Twitter, label: "Twitter", value: "@spiderdev", href: "#" },
                  { icon: Linkedin, label: "LinkedIn", value: "linkedin.com/in/alisheiikh", href: "#" },
                ].map((item, idx) => (
                  <motion.a
                    key={idx}
                    variants={itemVariants}
                    href={item.href}
                    className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-purple-400/30 transition-all"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/60">{item.label}</p>
                      <p className="text-white font-medium">{item.value}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-400/20">
            <CardContent className="p-8">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                My Vision
              </h3>
              <p className="text-white/80 leading-relaxed">
                Musica isn't just another music app. It's a platform built with care, designed to bring people closer to
                the music they love. Every feature, every interaction, is crafted with the user experience in mind.
                Music has the power to connect, inspire, and transform. Let's make that experience unforgettable
                together.
              </p>
            </CardContent>
          </Card>

          <motion.div variants={itemVariants} className="flex gap-4 pt-6">
            {showSkipButton && (
              <Button
                onClick={handleSkip}
                className="flex-1 bg-white text-purple-900 hover:bg-white/90 font-semibold py-6 text-lg"
              >
                Get Started with Musica
              </Button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
