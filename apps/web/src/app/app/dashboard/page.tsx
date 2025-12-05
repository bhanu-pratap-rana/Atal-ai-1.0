'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { authLogger } from '@/lib/auth-logger'
import type { User } from '@supabase/supabase-js'
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Bot, 
  FileText, 
  Settings,
  LogOut
} from 'lucide-react'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Feature card data
const getFeatureCards = (isTeacher: boolean) => [
  {
    title: 'Curriculum',
    description: 'Access digital literacy curriculum and educational resources.',
    icon: BookOpen,
    emoji: '📚',
    href: '/app/curriculum'
  },
  {
    title: 'Classes',
    description: 'Manage your classes and student enrollments.',
    icon: Users,
    emoji: '👥',
    href: isTeacher ? '/app/teacher/classes' : '/app/student/classes'
  },
  {
    title: 'Progress',
    description: 'Track student progress and performance metrics.',
    icon: BarChart3,
    emoji: '📊',
    href: '/app/progress'
  },
  {
    title: 'AI Tools',
    description: 'Leverage AI-powered tools for personalized learning.',
    icon: Bot,
    emoji: '🤖',
    href: '/app/ai-tools'
  },
  {
    title: 'Assessments',
    description: 'Create and manage assessments and quizzes.',
    icon: FileText,
    emoji: '📝',
    href: isTeacher ? '/app/teacher/assessments' : '/app/student/assessments'
  },
  {
    title: 'Settings',
    description: 'Manage your account and application preferences.',
    icon: Settings,
    emoji: '⚙️',
    href: '/app/settings'
  }
]

// Stat Card Component
function StatCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-[20px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center gap-4"
    >
      <div className="w-12 h-12 bg-primary-light rounded-[12px] flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </motion.div>
  )
}

// Feature Card Component
function FeatureCard({ 
  title, 
  description, 
  emoji, 
  onClick 
}: { 
  title: string
  description: string
  emoji: string
  onClick: () => void 
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(255, 126, 51, 0.3)' }}
      className="p-[3px] rounded-[20px] bg-gradient-primary shadow-primary-md cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-white rounded-[17px] p-5 h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary-light rounded-[10px] flex items-center justify-center text-xl">
            {emoji}
          </div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Check both app_metadata (set by admin) and user_metadata for role
  const isTeacher = user?.app_metadata?.role === 'teacher' || user?.user_metadata?.role === 'teacher'
  const userName = user?.user_metadata?.full_name || user?.app_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      router.refresh()
      router.push('/student/start')
    } catch (error) {
      authLogger.error('[Dashboard] Sign out failed', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  const featureCards = getFeatureCards(isTeacher)

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0">
                <Image
                  src="/assets/logo.png"
                  alt="ATAL AI Logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain rounded-full"
                  style={{
                    boxShadow: `
                      0 0 0 2px white,
                      0 0 0 3px var(--color-primary),
                      0 2px 8px rgba(255, 126, 51, 0.25)
                    `
                  }}
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                  ATAL AI Tutorial
                </h1>
                <p className="text-xs md:text-sm text-gray-500">Smart Learning Platform</p>
              </div>
            </div>

            {/* Sign Out Button */}
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Welcome Banner */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-primary rounded-[20px] p-6 md:p-8 mb-8 text-white shadow-primary-lg"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-1">
                  Welcome back, {userName}! 🎉
                </h2>
                <p className="text-white/90 text-sm md:text-base">
                  {isTeacher 
                    ? 'Manage your classes and track student progress from your dashboard.'
                    : 'Continue your learning journey and track your progress.'}
                </p>
              </div>
              {isTeacher && (
                <Button
                  onClick={() => router.push('/app/teacher/classes')}
                  variant="secondary"
                  className="bg-white text-primary hover:bg-gray-50 shrink-0"
                >
                  Create Class
                </Button>
              )}
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon="📚" value={isTeacher ? 3 : 2} label="Classes" />
            <StatCard icon="📝" value={isTeacher ? 12 : 8} label="Assessments" />
            <StatCard icon="🏆" value={5} label="Achievements" />
            <StatCard icon="🔥" value={7} label="Day Streak" />
          </div>

          {/* Feature Cards Grid */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {featureCards.map((card) => (
                <FeatureCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  emoji={card.emoji}
                  onClick={() => router.push(card.href)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
