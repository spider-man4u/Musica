'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Settings } from 'lucide-react'

interface UserData {
  name: string
  email: string
  bio: string
  location: string
  avatar: string
}

export default function UserProfile() {
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    bio: 'Music enthusiast',
    location: 'New York, USA',
    avatar: '/placeholder.svg?height=200&width=200'
  })

  useEffect(() => {
    // Load user data from localStorage
    const storedName = localStorage.getItem('username')
    const storedEmail = localStorage.getItem('email')
    if (storedName || storedEmail) {
      setUserData(prev => ({
        ...prev,
        name: storedName || prev.name,
        email: storedEmail || prev.email,
      }))
    }
  }, [])

  return (
    <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
      <CardContent className="p-4">
        <div className="flex items-center">
          <Avatar className="h-16 w-16 mr-4">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback>{userData.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{userData.name}</h2>
            <p className="text-sm opacity-75">{userData.bio}</p>
            <div className="flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-xs">{userData.location}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          <Button variant="secondary" size="sm">
            Edit Profile
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
