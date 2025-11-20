'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  rotateStaffPin,
  getStaffPinRotationInfo,
  searchSchools,
} from '@/app/actions/school'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Shield, RefreshCw, Search } from 'lucide-react'

// Simple card component without logo
function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="p-[3px] rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-md">
      <div className="bg-background rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-text-secondary mb-4">{description}</p>
        {children}
      </div>
    </div>
  )
}

export default function AdminSchoolsPage() {
  const [activeStep, setActiveStep] = useState<'search' | 'history' | 'rotate'>('search')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedSchool, setSelectedSchool] = useState<{
    code: string
    name: string
  } | null>(null)

  // PIN Rotation form
  const [schoolCode, setSchoolCode] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  // Rotation info
  const [rotationInfo, setRotationInfo] = useState<any>(null)

  // Search schools
  async function handleSearch() {
    if (!searchQuery.trim()) {
      toast.error('Please enter a school code or name')
      return
    }

    setLoading(true)
    try {
      const result = await searchSchools(searchQuery)
      if (result.success && result.data) {
        setSearchResults(result.data)
        if (result.data.length === 0) {
          toast.info('No schools found matching your search')
        }
      } else {
        toast.error(result.error || 'Failed to search schools')
      }
    } catch (error) {
      toast.error('An error occurred while searching')
    } finally {
      setLoading(false)
    }
  }

  // Select a school from search results
  function selectSchool(school: any) {
    setSelectedSchool({
      code: school.school_code,
      name: school.school_name,
    })
    setSchoolCode(school.school_code)
    setSearchResults([])
    setSearchQuery('')
  }

  // Get rotation info
  async function handleGetRotationInfo() {
    if (!schoolCode.trim()) {
      toast.error('Please enter a school code')
      return
    }

    setLoading(true)
    try {
      const result = await getStaffPinRotationInfo(schoolCode.toUpperCase().trim())
      if (result.success) {
        setRotationInfo(result)
        if (!result.hasCredentials) {
          toast.info('No credentials found for this school')
        }
      } else {
        toast.error(result.error || 'Failed to fetch rotation info')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Rotate PIN
  async function handleRotatePin(e: React.FormEvent) {
    e.preventDefault()

    if (!schoolCode.trim()) {
      toast.error('Please enter a school code')
      return
    }

    if (newPin.length < 4) {
      toast.error('PIN must be at least 4 characters long')
      return
    }

    if (newPin !== confirmPin) {
      toast.error('PINs do not match')
      return
    }

    setLoading(true)
    try {
      const result = await rotateStaffPin(schoolCode.toUpperCase().trim(), newPin)

      if (result.success) {
        toast.success(
          `PIN rotated successfully for ${result.schoolName} (${result.schoolCode})`
        )
        setNewPin('')
        setConfirmPin('')
        // Refresh rotation info
        handleGetRotationInfo()
      } else {
        toast.error(result.error || 'Failed to rotate PIN')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header - Single Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              School PIN Management
            </h1>
            <p className="text-xs text-text-secondary">
              Manage staff PINs and verify rotation history
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-background/50 p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveStep('search')}
            className={`flex-1 py-2 px-4 rounded font-medium text-sm transition-all ${
              activeStep === 'search'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            <Search className="h-4 w-4 inline mr-2" />
            Step 1: Search
          </button>
          <button
            onClick={() => setActiveStep('history')}
            className={`flex-1 py-2 px-4 rounded font-medium text-sm transition-all ${
              activeStep === 'history'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Step 2: History
          </button>
          <button
            onClick={() => setActiveStep('rotate')}
            className={`flex-1 py-2 px-4 rounded font-medium text-sm transition-all ${
              activeStep === 'rotate'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            <RefreshCw className="h-4 w-4 inline mr-2" />
            Step 3: Rotate
          </button>
        </div>

        {/* Content Area - Only Show Active Step */}
        <div className="space-y-6">
          {/* Step 1: School Search */}
          {activeStep === 'search' && (
            <Card
              title="Step 1: Search Schools"
              description="Find a school by code or name"
            >
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., 14H0001 or School Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    loading={loading}
                    size="sm"
                    className="shadow-[0_4px_12px_rgba(255,140,66,0.25)]"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                    {searchResults.map((school) => (
                      <button
                        key={school.id}
                        onClick={() => selectSchool(school)}
                        className="w-full text-left p-3 hover:bg-surface transition-colors"
                      >
                        <div className="font-semibold text-sm text-foreground">
                          {school.school_name}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {school.school_code} • {school.district}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected School Display */}
                {selectedSchool && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                    <p className="text-xs text-green-900 font-semibold">
                      ✓ Selected
                    </p>
                    <p className="text-xs text-green-900 mt-1">
                      {selectedSchool.name}
                    </p>
                    <p className="text-xs text-green-700 font-mono">
                      {selectedSchool.code}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Step 2: Check History */}
          {activeStep === 'history' && (
            <Card
              title="Step 2: Check PIN History"
              description="View rotation history for selected school"
            >
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="School Code"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    disabled={loading}
                    maxLength={10}
                    className="flex-1 uppercase font-mono text-sm"
                  />
                  <Button
                    onClick={handleGetRotationInfo}
                    disabled={loading}
                    loading={loading}
                    size="sm"
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>

                {rotationInfo && (
                  <div className={`border-l-4 p-3 rounded text-xs ${
                    rotationInfo.hasCredentials
                      ? 'bg-blue-50 border-blue-500 text-blue-900'
                      : 'bg-yellow-50 border-yellow-500 text-yellow-900'
                  }`}>
                    {rotationInfo.hasCredentials ? (
                      <div className="space-y-1">
                        <p><strong>{rotationInfo.schoolName}</strong></p>
                        <p>Created: {new Date(rotationInfo.createdAt).toLocaleDateString()}</p>
                        {rotationInfo.lastRotatedAt && (
                          <p>Last Rotated: {new Date(rotationInfo.lastRotatedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    ) : (
                      <p>No PIN credentials found - create one in Step 3</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Step 3: Rotate PIN */}
          {activeStep === 'rotate' && (
            <Card
              title="Step 3: Rotate PIN"
              description="Set or update the staff PIN"
            >
              <form onSubmit={handleRotatePin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school-code-rotate" className="text-sm">
                    School Code
                  </Label>
                  <Input
                    id="school-code-rotate"
                    type="text"
                    placeholder="14H0182"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    required
                    disabled={loading}
                    maxLength={10}
                    className="uppercase font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-pin" className="text-sm">
                    New Staff PIN
                  </Label>
                  <Input
                    id="new-pin"
                    type="password"
                    placeholder="e.g., 1234"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    required
                    disabled={loading}
                    minLength={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-text-secondary">
                    Min 4 characters (numeric recommended)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pin" className="text-sm">
                    Confirm PIN
                  </Label>
                  <Input
                    id="confirm-pin"
                    type="password"
                    placeholder="Re-enter PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    required
                    disabled={loading}
                    minLength={4}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="bg-orange-50 border-l-4 border-primary p-3 rounded text-xs text-orange-900">
                  <p><strong>⚠️ Security Notice</strong></p>
                  <p className="mt-1">PIN will be bcrypt hashed. Old PIN becomes invalid immediately.</p>
                </div>

                <Button
                  type="submit"
                  className="w-full shadow-[0_8px_20px_rgba(255,140,66,0.35)]"
                  disabled={loading || newPin !== confirmPin || newPin.length < 4}
                  loading={loading}
                  size="lg"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rotate PIN
                </Button>
              </form>
            </Card>
          )}

          {/* Quick Help - Always Show */}
          <div className="mt-8 bg-gradient-to-r from-orange-50 to-yellow-50 border border-primary/20 p-4 rounded-lg">
            <h3 className="font-semibold text-foreground text-sm mb-2">📋 Quick Guide</h3>
            <ul className="text-sm text-text-secondary space-y-2">
              <li><strong>Step 1:</strong> Search for a school by code or name</li>
              <li><strong>Step 2:</strong> Check when the PIN was last rotated</li>
              <li><strong>Step 3:</strong> Set or update the staff PIN for teachers</li>
              <li><strong>Result:</strong> Teachers use the new PIN for registration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
