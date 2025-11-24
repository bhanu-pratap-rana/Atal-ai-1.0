'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  rotateStaffPin,
  searchSchools,
  checkAdminAuth,
} from '@/app/actions/school'
import {
  getDistricts,
  getBlocksByDistrict,
  getSchoolsByDistrictAndBlock,
  getSchoolPinStatus,
  type District,
  type Block,
  type SchoolData,
} from '@/app/actions/school-finder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Shield, RefreshCw, Search, Copy, Check, MapPin } from 'lucide-react'

// School Finder Modal Component
function SchoolFinderModal({
  isOpen,
  onClose,
  onSelectSchool,
}: {
  isOpen: boolean
  onClose: () => void
  onSelectSchool: (school: SchoolData) => Promise<void>
}) {
  const [districts, setDistricts] = useState<District[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [schools, setSchools] = useState<SchoolData[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [selectedBlock, setSelectedBlock] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Load districts on mount
  useEffect(() => {
    if (isOpen) {
      loadDistricts()
    }
  }, [isOpen])

  // Load blocks when district changes
  useEffect(() => {
    if (selectedDistrict) {
      loadBlocks()
      setBlocks([])
      setSchools([])
      setSelectedBlock('')
    }
  }, [selectedDistrict])

  // Load schools when district OR block changes
  useEffect(() => {
    if (selectedDistrict) {
      loadSchools()
    }
  }, [selectedDistrict, selectedBlock])

  async function loadDistricts() {
    setLoading(true)
    try {
      const result = await getDistricts()
      if (result.success) {
        setDistricts(result.data)
      } else {
        toast.error(result.error || 'Failed to load districts')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function loadBlocks() {
    if (!selectedDistrict) return

    setLoading(true)
    try {
      const result = await getBlocksByDistrict(selectedDistrict)
      if (result.success) {
        setBlocks(result.data)
      } else {
        toast.error(result.error || 'Failed to load blocks')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function loadSchools() {
    if (!selectedDistrict) return

    setLoading(true)
    try {
      const result = await getSchoolsByDistrictAndBlock(
        selectedDistrict,
        selectedBlock || undefined
      )
      if (result.success) {
        setSchools(result.data)
      } else {
        toast.error(result.error || 'Failed to load schools')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Find School by Location
        </h2>

        {/* District Selection */}
        <div className="mb-4">
          <Label className="text-sm font-semibold mb-2 block">District</Label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            disabled={loading}
          >
            <option value="">-- Select District --</option>
            {districts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Block Selection */}
        {selectedDistrict && (
          <div className="mb-4">
            <Label className="text-sm font-semibold mb-2 block">Block (Optional)</Label>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              disabled={loading}
            >
              <option value="">-- All Blocks --</option>
              {blocks.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name || 'Not Specified'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Schools List */}
        {schools.length > 0 && (
          <div className="border border-gray-300 rounded-lg divide-y max-h-64 overflow-y-auto">
            {schools.map((school) => (
              <button
                key={school.id}
                onClick={async () => {
                  try {
                    await onSelectSchool(school)
                  } finally {
                    onClose()
                  }
                }}
                className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <div className="font-semibold text-sm text-foreground">
                  {school.school_name}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <strong>Code:</strong> {school.school_code} • <strong>Block:</strong>{' '}
                  {school.block || 'N/A'}
                </div>
                {school.address && (
                  <div className="text-xs text-gray-500 mt-1">{school.address}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {selectedDistrict && schools.length === 0 && !loading && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No schools found in {selectedBlock ? `${selectedBlock} block` : 'this district'}
          </div>
        )}

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="outline"
          size="sm"
          className="mt-4 w-full"
        >
          Close
        </Button>
      </div>
    </div>
  )
}

// Copy to Clipboard Component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Code copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`p-2 rounded transition-all ${
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      }`}
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

// Main Admin Panel
export default function AdminSchoolsPage() {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SchoolData[]>([])
  const [finderModalOpen, setFinderModalOpen] = useState(false)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  // Check admin authorization on mount
  useEffect(() => {
    async function verifyAuth() {
      try {
        const result = await checkAdminAuth()
        if (result.authorized) {
          setAuthorized(true)
        } else {
          setAuthorized(false)
          setAuthError(result.error || 'Unauthorized')
        }
      } catch (error) {
        setAuthorized(false)
        setAuthError('Failed to verify authorization')
      }
    }

    verifyAuth()
  }, [])

  // Selected school data
  const [selectedSchool, setSelectedSchool] = useState<{
    id: string
    code: string
    name: string
  } | null>(null)

  // PIN Rotation form
  const [schoolCode, setSchoolCode] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  // PIN status
  const [pinStatus, setPinStatus] = useState<{
    exists: boolean
    createdAt?: string
    lastRotatedAt?: string
  } | null>(null)

  // Search schools by code or name
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

  // Handle school selection from search or finder
  async function handleSelectSchool(school: SchoolData) {
    setSelectedSchool({
      id: school.id,
      code: school.school_code,
      name: school.school_name,
    })
    setSchoolCode(school.school_code)
    setSearchResults([])
    setSearchQuery('')

    // Auto-fetch PIN status
    await handleGetPinStatus(school.school_code)
  }

  // Get PIN status
  async function handleGetPinStatus(code: string) {
    const codeToCheck = code || schoolCode
    if (!codeToCheck.trim()) {
      toast.error('Please enter a school code')
      return
    }

    setLoading(true)
    try {
      const result = await getSchoolPinStatus(codeToCheck.toUpperCase().trim())
      if (result.success) {
        setPinStatus({
          exists: result.exists,
          createdAt: result.createdAt,
          lastRotatedAt: result.lastRotatedAt,
        })
      } else {
        toast.error(result.error || 'Failed to fetch PIN status')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Rotate or create PIN
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
        const action = pinStatus?.exists ? 'rotated' : 'created'
        toast.success(`PIN ${action} successfully for ${result.schoolName}`)
        setNewPin('')
        setConfirmPin('')

        // Refresh PIN status
        await handleGetPinStatus(schoolCode)
      } else {
        toast.error(result.error || 'Failed to rotate PIN')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (authorized === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Verifying authorization...</p>
        </div>
      </div>
    )
  }

  // Show authorization error
  if (!authorized || authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface p-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-4">
            {authError || 'You do not have permission to access this page. Admin access required.'}
          </p>
          <Button
            onClick={() => (window.location.href = '/app/dashboard')}
            variant="outline"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
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

        {/* School Finder Modal */}
        <SchoolFinderModal
          isOpen={finderModalOpen}
          onClose={() => setFinderModalOpen(false)}
          onSelectSchool={handleSelectSchool}
        />

        {/* Step 1: Find School */}
        <div className="mb-6 p-6 bg-white border border-primary/20 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Step 1: Find School
          </h2>

          <div className="space-y-4">
            {/* Quick Search */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Quick Search by Code or Name</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 14H0182 or School Name"
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
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border border-border rounded-lg divide-y max-h-48 overflow-y-auto">
                {searchResults.map((school) => (
                  <button
                    key={school.id}
                    onClick={() => handleSelectSchool(school)}
                    className="w-full text-left p-3 hover:bg-surface transition-colors flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-sm text-foreground">
                        {school.school_name}
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        {school.school_code} • {school.district}
                      </div>
                    </div>
                    <Copy className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Hierarchical Finder Button */}
            <Button
              onClick={() => setFinderModalOpen(true)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Or Browse by District &amp; Block
            </Button>
          </div>

          {/* Selected School Display */}
          {selectedSchool && (
            <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-green-900 font-semibold">✓ Selected School</p>
                  <p className="text-sm text-green-900 font-semibold mt-1">
                    {selectedSchool.name}
                  </p>
                  <p className="text-xs text-green-700 font-mono mt-1">
                    Code: {selectedSchool.code}
                  </p>
                </div>
                <CopyButton text={selectedSchool.code} />
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Check/Create PIN */}
        {selectedSchool && (
          <div className="mb-6 p-6 bg-white border border-primary/20 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Step 2: PIN Status
            </h2>

            <div className="space-y-4">
              {!pinStatus ? (
                <Button
                  onClick={() => handleGetPinStatus(schoolCode)}
                  variant="outline"
                  size="sm"
                  loading={loading}
                >
                  Check PIN Status
                </Button>
              ) : pinStatus.exists ? (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-xs text-blue-900 font-semibold">✓ PIN Exists</p>
                  <p className="text-sm text-blue-900 mt-2">
                    <strong>Created:</strong>{' '}
                    {pinStatus.createdAt
                      ? new Date(pinStatus.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                  {pinStatus.lastRotatedAt && (
                    <p className="text-sm text-blue-900">
                      <strong>Last Rotated:</strong>{' '}
                      {new Date(pinStatus.lastRotatedAt).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-xs text-blue-700 mt-3 font-semibold">
                    👇 Scroll down to Step 3 to rotate the PIN
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="text-xs text-yellow-900 font-semibold">⚠ No PIN Found</p>
                  <p className="text-sm text-yellow-900 mt-2">
                    This school doesn&apos;t have a PIN yet. Create one in Step 3.
                  </p>
                  <p className="text-xs text-yellow-700 mt-3 font-semibold">
                    👇 Scroll down to Step 3 to create the PIN
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Rotate/Create PIN */}
        {selectedSchool && (
          <div className="p-6 bg-white border border-primary/20 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Step 3: {pinStatus?.exists ? 'Rotate' : 'Create'} PIN
            </h2>

            <form onSubmit={handleRotatePin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school-code-rotate" className="text-sm">
                  School Code
                </Label>
                <Input
                  id="school-code-rotate"
                  type="text"
                  value={schoolCode}
                  disabled
                  className="bg-gray-50 uppercase font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-pin" className="text-sm">
                  {pinStatus?.exists ? 'New' : ''} Staff PIN
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
                <p>
                  <strong>⚠️ Security Notice</strong>
                </p>
                <p className="mt-1">
                  PIN will be bcrypt hashed.{' '}
                  {pinStatus?.exists
                    ? 'Old PIN becomes invalid immediately.'
                    : 'Teachers can use this PIN for registration.'}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full shadow-[0_8px_20px_rgba(255,140,66,0.35)]"
                disabled={loading || newPin !== confirmPin || newPin.length < 4}
                loading={loading}
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {pinStatus?.exists ? 'Rotate' : 'Create'} PIN
              </Button>
            </form>

            {/* Help */}
            <div className="mt-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-primary/20 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground text-sm mb-2">📋 Quick Guide</h3>
              <ul className="text-sm text-text-secondary space-y-2">
                <li>
                  <strong>Step 1:</strong> Search schools or browse by district/block
                </li>
                <li>
                  <strong>Step 2:</strong> Click school → Code auto-fills → Check PIN status
                </li>
                <li>
                  <strong>Step 3:</strong> {pinStatus?.exists ? 'Rotate' : 'Create'} PIN for
                  teachers
                </li>
                <li>
                  <strong>Result:</strong> Teachers use code + PIN for registration
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
