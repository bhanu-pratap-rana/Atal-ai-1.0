'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSchoolPINInfo, rotateSchoolPIN, getAllSchoolsWithPINs, getPINStatistics } from '@/app/actions/admin-pin-management'
import type { SchoolPINInfo, SchoolListItem, PINStatistics } from '@/app/actions/admin-pin-management'
import { ArrowLeft, Search, RefreshCw, Eye, EyeOff, LogOut, Wand2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { createBrowserClient } from '@supabase/ssr'

// Generate a random 4-digit PIN
function generateRandomPIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export default function AdminSchoolPINsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [allSchools, setAllSchools] = useState<SchoolListItem[]>([])
  const [filteredSchools, setFilteredSchools] = useState<SchoolListItem[]>([])
  const [stats, setStats] = useState<PINStatistics | null>(null)
  const [selectedSchool, setSelectedSchool] = useState<SchoolPINInfo | null>(null)
  const [rotatingId, setRotatingId] = useState<string | null>(null)
  const [showNewPin, setShowNewPin] = useState(false)
  const [newPin, setNewPin] = useState<string | null>(null)
  const [loadingSchoolDetails, setLoadingSchoolDetails] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null)

  // Initialize supabase client
  useEffect(() => {
    supabaseRef.current = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  // Load page data
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: { user } } = await supabase.auth.getUser()

        if (!user?.email) {
          router.push('/admin/login')
          return
        }

        // Check if user is super_admin
        const role = user.app_metadata?.role as string
        setIsSuperAdmin(role === 'super_admin')

        // Load all schools
        const schoolsResult = await getAllSchoolsWithPINs()
        if (schoolsResult.success && Array.isArray(schoolsResult.data)) {
          setAllSchools(schoolsResult.data as SchoolListItem[])
          setFilteredSchools(schoolsResult.data as SchoolListItem[])
        }

        // Load statistics
        const statsResult = await getPINStatistics()
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data as PINStatistics)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndLoad()
  }, [router])

  // Filter schools as user types (instant suggestions)
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setFilteredSchools(allSchools)
      setShowSuggestions(false)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = allSchools.filter(
        (school) =>
          school.schoolName.toLowerCase().includes(query) ||
          school.schoolCode.toLowerCase().includes(query) ||
          school.districtName?.toLowerCase().includes(query)
      )
      setFilteredSchools(filtered)
      setShowSuggestions(true)
    }
  }, [searchQuery, allSchools])

  async function handleSelectSchool(school: SchoolListItem) {
    setLoadingSchoolDetails(true)
    setSelectedSchool(null)
    setNewPin(null)
    setShowNewPin(false)
    setShowSuggestions(false)
    setSearchQuery(school.schoolName)

    try {
      const result = await getSchoolPINInfo(school.schoolId)
      if (result.success && result.data) {
        setSelectedSchool(result.data as SchoolPINInfo)
      } else {
        toast.error(result.error || 'Failed to load school PIN info')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoadingSchoolDetails(false)
    }
  }

  async function handleRotatePin(customPin?: string) {
    if (!selectedSchool) return

    const pinToUse = customPin || generateRandomPIN()

    setRotatingId(selectedSchool.schoolId)
    try {
      const result = await rotateSchoolPIN(selectedSchool.schoolId, pinToUse)
      if (result.success && result.data) {
        const newPinValue = (result.data as { newPIN: string }).newPIN || pinToUse
        setNewPin(newPinValue)
        setShowNewPin(true)
        toast.success(`PIN ${selectedSchool.lastRotatedAt ? 'rotated' : 'generated'}! New PIN: ${newPinValue}`)

        // Reload all schools
        const schoolsResult = await getAllSchoolsWithPINs()
        if (schoolsResult.success && Array.isArray(schoolsResult.data)) {
          setAllSchools(schoolsResult.data as SchoolListItem[])
        }

        // Reload stats
        const statsResult = await getPINStatistics()
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data as PINStatistics)
        }

        // Reload selected school
        const schoolResult = await getSchoolPINInfo(selectedSchool.schoolId)
        if (schoolResult.success && schoolResult.data) {
          setSelectedSchool(schoolResult.data as SchoolPINInfo)
        }
      } else {
        toast.error(result.error || 'Failed to generate PIN')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setRotatingId(null)
    }
  }

  function handleGenerateRandomPin() {
    handleRotatePin(generateRandomPIN())
  }

  async function handleSignOut() {
    try {
      if (supabaseRef.current) {
        await supabaseRef.current.auth.signOut()
      }
      router.push('/admin/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  function copyPinToClipboard() {
    if (newPin) {
      navigator.clipboard.writeText(newPin)
      setCopied(true)
      toast.success('PIN copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-secondary">Loading PIN management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Only show Back to Dashboard for super admin */}
            {isSuperAdmin && (
              <Button
                onClick={() => router.push('/admin/dashboard')}
                variant="outline"
                size="sm"
                className="text-primary border-primary hover:bg-orange-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
            <h1 className="text-2xl font-bold text-text">School PIN Management</h1>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics */}
        {stats && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
              <p className="text-sm text-text-secondary">Total Schools</p>
              <p className="text-3xl font-bold text-text">{stats.totalSchools}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
              <p className="text-sm text-text-secondary">Schools with PIN</p>
              <p className="text-3xl font-bold text-green-600">{stats.schoolsWithPINs}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
              <p className="text-sm text-text-secondary">Without PIN</p>
              <p className="text-3xl font-bold text-orange-600">{stats.schoolsWithoutPINs}</p>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Search and School List */}
          <div className="lg:col-span-2">
            <section className="bg-white rounded-lg shadow border border-gray-100">
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-xl font-bold text-text mb-4">🔍 Step 1: Find School</h2>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Type school name or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery && setShowSuggestions(true)}
                        className="w-full pr-10"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions && filteredSchools.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredSchools.slice(0, 10).map((school) => (
                        <button
                          key={school.schoolId}
                          onClick={() => handleSelectSchool(school)}
                          className="w-full p-3 text-left hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-text">{school.schoolName}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                              {school.schoolCode}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-text-secondary">{school.districtName}</span>
                            {school.hasPIN ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Has PIN</span>
                            ) : (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">No PIN</span>
                            )}
                          </div>
                        </button>
                      ))}
                      {filteredSchools.length > 10 && (
                        <p className="p-2 text-xs text-center text-text-secondary bg-gray-50">
                          +{filteredSchools.length - 10} more results...
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  Start typing to see matching schools instantly
                </p>
              </div>

              {/* Loading School Details */}
              {loadingSchoolDetails && (
                <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <p className="text-text-secondary">Loading school details...</p>
                </div>
              )}

              {/* Selected School Info */}
              {selectedSchool && !loadingSchoolDetails && (
                <div className="p-6 border-b border-gray-200 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-700 font-medium">✓ Selected School</p>
                      <p className="text-lg font-bold text-green-900">{selectedSchool.schoolName}</p>
                      <p className="text-sm text-green-700">Code: {selectedSchool.schoolCode}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedSchool.schoolCode)
                        toast.success('School code copied!')
                      }}
                      className="p-2 hover:bg-green-100 rounded transition"
                    >
                      <Copy className="w-4 h-4 text-green-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* PIN Status */}
              {selectedSchool && (
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-text mb-4">📋 Step 2: PIN Status</h3>
                  {selectedSchool.lastRotatedAt ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-800">✓ PIN Exists</p>
                      <p className="text-sm text-green-700 mt-1">
                        <strong>Created:</strong> {new Date(selectedSchool.lastRotatedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-green-700">
                        <strong>Last Rotated:</strong> {new Date(selectedSchool.lastRotatedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        👇 Scroll down to Step 3 to rotate the PIN
                      </p>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-orange-800">⚠️ No PIN Set</p>
                      <p className="text-sm text-orange-700 mt-1">
                        This school doesn&apos;t have a PIN yet. Generate one below.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Generate/Rotate PIN */}
              {selectedSchool && (
                <div className="p-6">
                  <h3 className="text-lg font-bold text-text mb-4">
                    🔄 Step 3: {selectedSchool.lastRotatedAt ? 'Rotate PIN' : 'Generate PIN'}
                  </h3>

                  <div className="space-y-4">
                    {/* School Code Display */}
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">School Code</label>
                      <Input
                        type="text"
                        value={selectedSchool.schoolCode}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>

                    {/* Generated PIN Display */}
                    {newPin && showNewPin && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-green-800">✓ New PIN Generated</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowNewPin(!showNewPin)}
                              className="text-green-600 hover:text-green-700 p-1"
                              title={showNewPin ? 'Hide PIN' : 'Show PIN'}
                            >
                              {showNewPin ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={copyPinToClipboard}
                              className="text-green-600 hover:text-green-700 p-1"
                              title="Copy PIN"
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <p className="text-4xl font-mono font-bold text-green-700 text-center py-2">
                          {newPin}
                        </p>
                        <p className="text-xs text-green-600 text-center mt-2">
                          Share this PIN securely with the school staff
                        </p>
                      </div>
                    )}

                    {/* Generate PIN Button */}
                    <Button
                      onClick={handleGenerateRandomPin}
                      disabled={rotatingId === selectedSchool.schoolId}
                      className="w-full h-12 bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600 text-lg"
                    >
                      {rotatingId === selectedSchool.schoolId ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2" />
                          {selectedSchool.lastRotatedAt ? 'Generate New PIN' : 'Generate PIN'}
                        </>
                      )}
                    </Button>

                    {/* Security Notice */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-800">
                        <strong>⚠️ Security Notice</strong>
                        <br />
                        PIN will be bcrypt hashed. Old PIN becomes invalid immediately.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Guide when no school selected */}
              {!selectedSchool && (
                <div className="p-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">📖 Quick Guide</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li><strong>Step 1:</strong> Search schools or browse by district/block</li>
                      <li><strong>Step 2:</strong> Click school → Code auto-fills → Check PIN status</li>
                      <li><strong>Step 3:</strong> Generate or Rotate PIN for teachers</li>
                      <li><strong>Result:</strong> Teachers use code + PIN for registration</li>
                    </ul>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right: All Schools List */}
          <div>
            <section className="bg-white rounded-lg shadow border border-gray-100">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-text">All Schools ({allSchools.length})</h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {allSchools.map((school) => (
                  <button
                    key={school.schoolId}
                    onClick={() => handleSelectSchool(school)}
                    className={`w-full p-3 text-left border-b border-gray-100 hover:bg-orange-50 transition ${
                      selectedSchool?.schoolId === school.schoolId ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-text text-sm truncate pr-2">{school.schoolName}</p>
                      {school.hasPIN ? (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded shrink-0">PIN</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">No PIN</span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{school.schoolCode}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
