"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { FaGoogle, FaFacebook } from "react-icons/fa"

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"
    setIsLoggedIn(loggedIn)
    setIsLoading(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      alert("Please enter both username and password.")
      return
    }
    setIsLoggedIn(true)
    localStorage.setItem("isLoggedIn", "true")
    localStorage.setItem("username", username)
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) {
      alert("Please fill in all fields.")
      return
    }
    setIsLoggedIn(true)
    localStorage.setItem("isLoggedIn", "true")
    localStorage.setItem("username", username)
    localStorage.setItem("email", email)
  }

  const handleSocialLogin = (provider: string) => {
    console.log(`Logging in with ${provider}`)
    setIsLoggedIn(true)
    localStorage.setItem("isLoggedIn", "true")
  }

  const resetForm = () => {
    setUsername("")
    setPassword("")
    setEmail("")
    setShowLogin(false)
    setIsSignUp(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <AnimatePresence mode="wait">
          {!showLogin ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md p-8"
            >
              <div className="relative glass-dark rounded-3xl p-8 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-t-3xl">
                  <div className="relative w-full h-full">
                    <motion.div
                      className="absolute bottom-0 right-0 w-32 h-32"
                      animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3 }}
                    >
                      <img
                        src="https://i.ibb.co/LNDnrnw/Picsart-25-01-06-12-23-43-750.png"
                        alt="City illustration"
                        className="w-full h-full object-contain"
                      />
                    </motion.div>
                    <motion.div
                      className="absolute bottom-20 left-10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h1 className="text-4xl font-bold text-white mb-2">HELLO</h1>
                      <p className="text-white/70">Welcome to Musica</p>
                    </motion.div>
                  </div>
                </div>
                <div className="mt-72 space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-white text-purple-900 rounded-xl font-medium transition-colors hover:bg-white/90"
                    onClick={() => {
                      setIsSignUp(false)
                      setShowLogin(true)
                    }}
                  >
                    Sign In
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-transparent text-white rounded-xl font-medium border-2 border-white/30 transition-colors hover:bg-white/10"
                    onClick={() => {
                      setIsSignUp(true)
                      setShowLogin(true)
                    }}
                  >
                    Sign Up
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md p-8"
            >
              <div className="glass-dark rounded-3xl p-8">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white">{isSignUp ? "Create Account" : "Welcome Back"}</h2>
                  <p className="text-white/70">
                    {isSignUp ? "Please sign up to continue" : "Please sign in to continue"}
                  </p>
                </motion.div>
                <form onSubmit={isSignUp ? handleSignup : handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 transition-all"
                    />
                    {isSignUp && (
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 transition-all"
                      />
                    )}
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 transition-all"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-3 bg-white text-purple-900 rounded-xl font-medium transition-colors hover:bg-white/90"
                  >
                    {isSignUp ? "Sign Up" : "Sign In"}
                  </motion.button>
                </form>
                <div className="mt-6">
                  <p className="text-center text-white/70 mb-4">Or continue with</p>
                  <div className="flex justify-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSocialLogin("Google")}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <FaGoogle className="w-6 h-6 text-white" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSocialLogin("Facebook")}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <FaFacebook className="w-6 h-6 text-white" />
                    </motion.button>
                  </div>
                </div>
                <div className="mt-6 text-center space-y-2">
                  <button
                    onClick={() => {
                      if (isSignUp) {
                        setIsSignUp(false)
                      } else {
                        resetForm()
                      }
                    }}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {isSignUp ? "Already have an account? Sign In" : "Back to welcome screen"}
                  </button>
                  {!isSignUp && (
                    <div>
                      <button className="text-white/50 hover:text-white/70 transition-colors">Forgot password?</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return <div>{children}</div>
}

export default AuthWrapper
