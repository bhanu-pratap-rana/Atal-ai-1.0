'use client'

interface Tab {
  id: string
  label: string
  icon: string
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  disabled?: boolean
}

export function TabNavigation({ tabs, activeTab, onTabChange, disabled = false }: TabNavigationProps) {
  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
            activeTab === tab.id ? 'bg-primary text-white' : 'bg-muted text-text-secondary hover:bg-muted/80'
          }`}
          disabled={disabled}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  )
}
