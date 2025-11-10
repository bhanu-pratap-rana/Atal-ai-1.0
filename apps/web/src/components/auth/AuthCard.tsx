import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthCardProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-5xl">🤖</span>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              ATAL AI
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">Digital Empowerment Platform</p>
          </div>
          <div>
            <CardTitle className="text-orange-600">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-2">{description}</CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
