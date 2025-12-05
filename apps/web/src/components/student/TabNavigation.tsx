'use client'

import { cn } from '@/lib/utils'

/**
 * ATAL AI TabNavigation Component - Jyoti Theme
 * 
 * STRICT RULES:
 * - Active tab: PRIMARY background with white text
 * - Inactive tab: gray-100 background with text-secondary
 */

interface Tab {
  id: string
  label: string
  icon?: string
  disabled?: boolean
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
}

export function TabNavigation({ 
  tabs, 
  activeTab, 
  onTabChange, 
  disabled = false,
  size = 'default'
}: TabNavigationProps) {
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs',
    default: 'py-2 px-4 text-sm',
    lg: 'py-3 px-5 text-base'
  }

  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          className={cn(
            "flex-1 rounded-lg font-medium transition-all duration-200",
            sizeClasses[size],
            activeTab === tab.id
              ? 'bg-gradient-primary text-white shadow-sm'
              : 'bg-transparent text-text-secondary hover:bg-white hover:text-text-primary',
            (disabled || tab.disabled) && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled || tab.disabled}
        >
          {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
