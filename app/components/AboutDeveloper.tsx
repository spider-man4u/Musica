import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

export default function AboutDeveloper() {
  return (
    <Card className="bg-gradient-to-br from-pink-500 to-orange-400 text-white">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
            <Image
              src="https://i.ibb.co/M6GsjVV/IMG-20250105-234526.png"
              alt="Ali Sheikh"
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Ali Sheikh (Spider)</h3>
            <p className="text-sm">Full-stack developer & Music enthusiast</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
