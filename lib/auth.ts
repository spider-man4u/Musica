// Simple local storage based authentication
export interface User {
  id: string
  email: string
  username: string
  selectedArtists?: string[]
  createdAt: string
}

export class LocalAuth {
  private static USERS_KEY = "musica_users"
  private static CURRENT_USER_KEY = "musica_current_user"

  static getUsers(): User[] {
    try {
      const users = localStorage.getItem(this.USERS_KEY)
      return users ? JSON.parse(users) : []
    } catch {
      return []
    }
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
  }

  static getCurrentUser(): User | null {
    try {
      const user = localStorage.getItem(this.CURRENT_USER_KEY)
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  }

  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(this.CURRENT_USER_KEY)
    }
  }

  static signUp(email: string, password: string, username: string): { success: boolean; error?: string; user?: User } {
    const users = this.getUsers()

    // Check if user already exists
    if (users.find((u) => u.email === email)) {
      return { success: false, error: "User with this email already exists" }
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email,
      username,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    this.saveUsers(users)
    this.setCurrentUser(newUser)

    return { success: true, user: newUser }
  }

  static signIn(email: string, password: string): { success: boolean; error?: string; user?: User } {
    const users = this.getUsers()
    const user = users.find((u) => u.email === email)

    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    this.setCurrentUser(user)
    return { success: true, user }
  }

  static signOut(): void {
    this.setCurrentUser(null)
  }

  static updateUser(updates: Partial<User>): { success: boolean; user?: User } {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      return { success: false }
    }

    const users = this.getUsers()
    const userIndex = users.findIndex((u) => u.id === currentUser.id)

    if (userIndex === -1) {
      return { success: false }
    }

    const updatedUser = { ...currentUser, ...updates }
    users[userIndex] = updatedUser
    this.saveUsers(users)
    this.setCurrentUser(updatedUser)

    return { success: true, user: updatedUser }
  }
}
