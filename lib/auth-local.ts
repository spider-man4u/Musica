// LOCAL AUTHENTICATION SYSTEM - No external dependencies
export interface User {
  id: string
  email: string
  username: string
  fullName: string
  avatar?: string
  selectedArtists: string[]
  createdAt: string
  lastLogin: string
}

export interface AuthResult {
  success: boolean
  error?: string
  user?: User
}

export class LocalAuth {
  private static USERS_KEY = "musica_users"
  private static CURRENT_USER_KEY = "musica_current_user"
  private static SESSION_KEY = "musica_session"

  // Get all users from localStorage
  static getUsers(): User[] {
    try {
      const users = localStorage.getItem(this.USERS_KEY)
      return users ? JSON.parse(users) : []
    } catch (error) {
      console.error("Error getting users:", error)
      return []
    }
  }

  // Save users to localStorage
  static saveUsers(users: User[]): void {
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
    } catch (error) {
      console.error("Error saving users:", error)
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    try {
      const user = localStorage.getItem(this.CURRENT_USER_KEY)
      const session = localStorage.getItem(this.SESSION_KEY)

      if (!user || !session) return null

      // Check if session is still valid (24 hours)
      const sessionData = JSON.parse(session)
      const now = Date.now()
      const sessionAge = now - sessionData.timestamp
      const twentyFourHours = 24 * 60 * 60 * 1000

      if (sessionAge > twentyFourHours) {
        this.signOut()
        return null
      }

      return JSON.parse(user)
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  // Set current user and create session
  static setCurrentUser(user: User | null): void {
    try {
      if (user) {
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user))
        localStorage.setItem(
          this.SESSION_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            userId: user.id,
          }),
        )
      } else {
        localStorage.removeItem(this.CURRENT_USER_KEY)
        localStorage.removeItem(this.SESSION_KEY)
      }
    } catch (error) {
      console.error("Error setting current user:", error)
    }
  }

  // Sign up new user
  static signUp(email: string, password: string, username: string): AuthResult {
    try {
      // Validate input
      if (!email || !password || !username) {
        return { success: false, error: "All fields are required" }
      }

      if (password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters long" }
      }

      if (!this.isValidEmail(email)) {
        return { success: false, error: "Please enter a valid email address" }
      }

      const users = this.getUsers()

      // Check if user already exists
      if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: "An account with this email already exists" }
      }

      if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, error: "This username is already taken" }
      }

      // Create new user
      const newUser: User = {
        id: this.generateId(),
        email: email.toLowerCase(),
        username: username,
        fullName: username,
        selectedArtists: [],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }

      // Save user
      users.push(newUser)
      this.saveUsers(users)
      this.setCurrentUser(newUser)

      console.log("✅ User created successfully:", newUser.username)
      return { success: true, user: newUser }
    } catch (error) {
      console.error("Sign up error:", error)
      return { success: false, error: "An unexpected error occurred during sign up" }
    }
  }

  // Sign in existing user
  static signIn(email: string, password: string): AuthResult {
    try {
      // Validate input
      if (!email || !password) {
        return { success: false, error: "Email and password are required" }
      }

      const users = this.getUsers()
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

      if (!user) {
        return { success: false, error: "Invalid email or password" }
      }

      // Update last login
      user.lastLogin = new Date().toISOString()
      const userIndex = users.findIndex((u) => u.id === user.id)
      users[userIndex] = user
      this.saveUsers(users)

      this.setCurrentUser(user)

      console.log("✅ User signed in successfully:", user.username)
      return { success: true, user }
    } catch (error) {
      console.error("Sign in error:", error)
      return { success: false, error: "An unexpected error occurred during sign in" }
    }
  }

  // Sign out current user
  static signOut(): void {
    try {
      console.log("🔐 Signing out user")
      this.setCurrentUser(null)
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  // Update user profile
  static updateUser(updates: Partial<User>): AuthResult {
    try {
      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        return { success: false, error: "No user is currently signed in" }
      }

      const users = this.getUsers()
      const userIndex = users.findIndex((u) => u.id === currentUser.id)

      if (userIndex === -1) {
        return { success: false, error: "User not found" }
      }

      // Update user
      const updatedUser = { ...currentUser, ...updates }
      users[userIndex] = updatedUser
      this.saveUsers(users)
      this.setCurrentUser(updatedUser)

      console.log("✅ User updated successfully:", updatedUser.username)
      return { success: true, user: updatedUser }
    } catch (error) {
      console.error("Update user error:", error)
      return { success: false, error: "An unexpected error occurred while updating profile" }
    }
  }

  // Delete user account
  static deleteAccount(): AuthResult {
    try {
      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        return { success: false, error: "No user is currently signed in" }
      }

      const users = this.getUsers()
      const filteredUsers = users.filter((u) => u.id !== currentUser.id)
      this.saveUsers(filteredUsers)
      this.signOut()

      console.log("✅ User account deleted successfully")
      return { success: true }
    } catch (error) {
      console.error("Delete account error:", error)
      return { success: false, error: "An unexpected error occurred while deleting account" }
    }
  }

  // Get user by ID
  static getUserById(id: string): User | null {
    try {
      const users = this.getUsers()
      return users.find((u) => u.id === id) || null
    } catch (error) {
      console.error("Get user by ID error:", error)
      return null
    }
  }

  // Check if user is signed in
  static isSignedIn(): boolean {
    return this.getCurrentUser() !== null
  }

  // Get user stats
  static getUserStats() {
    try {
      const users = this.getUsers()
      const currentUser = this.getCurrentUser()

      return {
        totalUsers: users.length,
        currentUser: currentUser?.username || null,
        accountAge: currentUser ? this.getAccountAge(currentUser.createdAt) : null,
        lastLogin: currentUser?.lastLogin || null,
      }
    } catch (error) {
      console.error("Get user stats error:", error)
      return {
        totalUsers: 0,
        currentUser: null,
        accountAge: null,
        lastLogin: null,
      }
    }
  }

  // Helper methods
  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private static getAccountAge(createdAt: string): string {
    try {
      const created = new Date(createdAt)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - created.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) return "1 day"
      if (diffDays < 30) return `${diffDays} days`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
      return `${Math.floor(diffDays / 365)} years`
    } catch (error) {
      return "Unknown"
    }
  }

  // Clear all data (for testing/reset)
  static clearAllData(): void {
    try {
      localStorage.removeItem(this.USERS_KEY)
      localStorage.removeItem(this.CURRENT_USER_KEY)
      localStorage.removeItem(this.SESSION_KEY)
      console.log("✅ All authentication data cleared")
    } catch (error) {
      console.error("Clear data error:", error)
    }
  }

  // Export user data
  static exportUserData(): string {
    try {
      const currentUser = this.getCurrentUser()
      if (!currentUser) return ""

      return JSON.stringify(currentUser, null, 2)
    } catch (error) {
      console.error("Export user data error:", error)
      return ""
    }
  }
}
