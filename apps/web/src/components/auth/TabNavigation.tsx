interface Tab {
  id: string
  label: string
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

/**
 * Reusable tab navigation component
 * Used in auth flows to switch between different views
 */
export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: TabNavigationProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-primary text-white'
              : 'bg-muted text-text-secondary hover:bg-muted/80'
          }`}
          aria-pressed={activeTab === tab.id}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
