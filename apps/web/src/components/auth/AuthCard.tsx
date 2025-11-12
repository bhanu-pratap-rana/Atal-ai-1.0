import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthCardProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-white p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center shadow-lg p-1">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-2">
              <Image
                src="/assets/logo.png"
                alt="ATAL AI Logo"
                width={80}
                height={80}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-gradient">
              ATAL AI
            </CardTitle>
            <p className="text-sm text-text-secondary mt-1">Digital Empowerment Platform</p>
          </div>
          <div>
            <CardTitle className="text-primary text-xl">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-2 text-text-secondary">{description}</CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
