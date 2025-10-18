import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function About() {
  return (
    <main className="p-4 pb-20 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">About Musica</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Our Mission</CardTitle>
            <CardDescription className="text-gray-200">Bringing music to everyone, everywhere</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Musica is a passion project developed by music enthusiasts who believe in the power of music to connect people and enhance lives. Our goal is to create a platform that not only provides access to a vast library of songs but also offers a unique and engaging user experience.
            </p>
            <h2 className="text-xl font-semibold mb-2">Our Features</h2>
            <ul className="list-disc list-inside">
              <li>Personalized music recommendations</li>
              <li>High-quality audio streaming</li>
              <li>Social sharing and playlist collaboration</li>
              <li>Integrated mini-games for entertainment</li>
              <li>Detailed artist and album information</li>
            </ul>
          </CardContent>
        </Card>
        <div>
          <Card className="bg-gradient-to-br from-pink-500 to-orange-400 text-white mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">About the Developer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-48 h-48 rounded-full overflow-hidden mb-4 mx-auto">
                <Image
                  src="/images/design-mode/IMG-20250105-234526.png"
                  alt="Ali Sheikh"
                  width={192}
                  height={192}
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ali Sheikh (Spider)</h3>
              <p className="text-center">
                A full-stack developer with a background in music theory and composition. With over 5 years of experience in web development and a lifelong love for music, Ali created Musica to combine his passions and share them with the world.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-400 to-blue-500 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Connect with Us</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>Email: contact@musica.com</li>
                <li>Twitter: @musicaapp</li>
                <li>Instagram: @musicaofficial</li>
                <li>GitHub: github.com/musicaapp</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
