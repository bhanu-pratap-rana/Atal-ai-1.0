'use client'

import { useEffect, useState } from 'react'
import type { DashboardMetrics } from '@/app/actions/admin-metrics'
import {
  getDashboardMetrics,
  getSchoolsWithActivePINs,
  getAllSchools,
  getAllTeachers,
  getAllStudents,
  getSchoolsWithoutPINs,
} from '@/app/actions/admin-metrics'
import { School, Users, Lock, X, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * ATAL AI Dashboard Metrics - Jyoti Theme
 * 
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 */

type ModalType = 'schools' | 'teachers' | 'students' | 'activePINs' | 'inactivePINs' | null

interface SchoolItem {
  id: string
  schoolName: string
  schoolCode: string
  district: string
  block?: string | null
  hasPIN?: boolean
}

interface TeacherItem {
  id: string
  email: string
  name: string
  phone: string | null
  schoolName: string
  schoolCode: string
  createdAt: string
}

interface StudentItem {
  id: string
  email: string
  phone: string | null
  createdAt: string
  lastSignIn: string | null
}

interface ActivePINSchool {
  schoolId: string
  schoolName: string
  schoolCode: string
  districtName: string
  lastRotatedAt: string | null
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Data for modals
  const [schools, setSchools] = useState<SchoolItem[]>([])
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [students, setStudents] = useState<StudentItem[]>([])
  const [activePINSchools, setActivePINSchools] = useState<ActivePINSchool[]>([])
  const [inactivePINSchools, setInactivePINSchools] = useState<SchoolItem[]>([])

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const result = await getDashboardMetrics()
        if (result.success && result.data) {
          setMetrics(result.data)
        } else {
          setError(result.error || 'Failed to load metrics')
        }
      } catch {
        setError('An error occurred while loading metrics')
      } finally {
        setIsLoading(false)
      }
    }

    loadMetrics()
  }, [])

  async function openModal(type: ModalType) {
    setActiveModal(type)
    setModalLoading(true)
    setSearchQuery('')

    try {
      switch (type) {
        case 'schools': {
          const result = await getAllSchools()
          if (result.success && result.data) {
            setSchools(result.data)
          }
          break
        }
        case 'teachers': {
          const result = await getAllTeachers()
          if (result.success && result.data) {
            setTeachers(result.data)
          }
          break
        }
        case 'students': {
          const result = await getAllStudents()
          if (result.success && result.data) {
            setStudents(result.data)
          }
          break
        }
        case 'activePINs': {
          const result = await getSchoolsWithActivePINs()
          if (result.success && result.data) {
            setActivePINSchools(result.data)
          }
          break
        }
        case 'inactivePINs': {
          const result = await getSchoolsWithoutPINs()
          if (result.success && result.data) {
            setInactivePINSchools(result.data)
          }
          break
        }
      }
    } catch {
      // Handle error silently
    } finally {
      setModalLoading(false)
    }
  }

  function closeModal() {
    setActiveModal(null)
    setSearchQuery('')
  }

  // Filter functions
  const filteredSchools = schools.filter(
    (s) =>
      s.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.schoolCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.district.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.schoolName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredStudents = students.filter(
    (s) =>
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery))
  )

  const filteredActivePINs = activePINSchools.filter(
    (s) =>
      s.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.schoolCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredInactivePINs = inactivePINSchools.filter(
    (s) =>
      s.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.schoolCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-border-light rounded-[16px] p-4 h-24 animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-error-light border border-error rounded-[12px] p-4">
        <p className="text-sm text-error-dark">{error}</p>
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  const metricCards = [
    {
      title: 'Schools',
      value: metrics.totalSchools,
      icon: School,
      color: 'bg-primary-light',
      iconColor: 'text-primary',
      hoverColor: 'hover:border-primary',
      modalType: 'schools' as ModalType,
    },
    {
      title: 'Teachers',
      value: metrics.totalTeachers,
      icon: Users,
      color: 'bg-success-light',
      iconColor: 'text-success',
      hoverColor: 'hover:border-success',
      modalType: 'teachers' as ModalType,
    },
    {
      title: 'Students',
      value: metrics.totalStudents,
      icon: GraduationCap,
      color: 'bg-accent-light',
      iconColor: 'text-accent-dark',
      hoverColor: 'hover:border-accent',
      modalType: 'students' as ModalType,
    },
    {
      title: 'Active PINs',
      value: metrics.activePins,
      icon: Lock,
      color: 'bg-primary-light',
      iconColor: 'text-primary',
      hoverColor: 'hover:border-primary',
      modalType: 'activePINs' as ModalType,
    },
    {
      title: 'Inactive PINs',
      value: metrics.inactivePins,
      icon: Lock,
      color: 'bg-border-light',
      iconColor: 'text-text-tertiary',
      hoverColor: 'hover:border-text-tertiary',
      modalType: 'inactivePINs' as ModalType,
    },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.title}
              onClick={() => openModal(card.modalType)}
              className={`${card.color} rounded-[16px] p-6 border border-border text-left ${card.hoverColor} hover:shadow-md transition cursor-pointer`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
                <h3 className="text-sm text-text-secondary font-medium">{card.title}</h3>
              </div>
              <p className="text-3xl font-bold text-text-primary">{card.value}</p>
              <p className={`text-xs ${card.iconColor} mt-2 underline`}>Click to view</p>
            </button>
          )
        })}
      </div>

      {/* Universal Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-stone-50">
              <h2 className="text-xl font-bold text-text-primary">
                {activeModal === 'schools' && `All Schools (${filteredSchools.length})`}
                {activeModal === 'teachers' && `All Teachers (${filteredTeachers.length})`}
                {activeModal === 'students' && `All Students (${filteredStudents.length})`}
                {activeModal === 'activePINs' && `Schools with Active PINs (${filteredActivePINs.length})`}
                {activeModal === 'inactivePINs' && `Schools without PINs (${filteredInactivePINs.length})`}
              </h2>
              <button onClick={closeModal} className="text-text-tertiary hover:text-text-primary transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-border">
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[55vh]">
              {modalLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-text-tertiary">Loading...</p>
                </div>
              ) : (
                <>
                  {/* Schools List */}
                  {activeModal === 'schools' && (
                    filteredSchools.length === 0 ? (
                      <p className="text-center text-text-tertiary py-8">No schools found</p>
                    ) : (
                      <div className="space-y-3">
                        {filteredSchools.map((school) => (
                          <div key={school.id} className="bg-stone-50 rounded-[12px] p-4 border border-border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-text-primary">{school.schoolName}</p>
                                <p className="text-sm text-text-secondary">{school.district}</p>
                                {school.block && (
                                  <p className="text-xs text-text-tertiary">Block: {school.block}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-xs bg-border-light text-text-secondary px-2 py-1 rounded-full font-mono">
                                  {school.schoolCode}
                                </span>
                                {school.hasPIN !== undefined && (
                                  <p className={`text-xs mt-1 ${school.hasPIN ? 'text-success' : 'text-error'}`}>
                                    {school.hasPIN ? '✓ PIN Active' : '✗ No PIN'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Teachers List */}
                  {activeModal === 'teachers' && (
                    filteredTeachers.length === 0 ? (
                      <p className="text-center text-text-tertiary py-8">No teachers found</p>
                    ) : (
                      <div className="space-y-3">
                        {filteredTeachers.map((teacher) => (
                          <div key={teacher.id} className="bg-stone-50 rounded-[12px] p-4 border border-border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-text-primary">{teacher.name}</p>
                                <p className="text-sm text-text-secondary">{teacher.email}</p>
                                {teacher.phone && (
                                  <p className="text-sm text-text-secondary">{teacher.phone}</p>
                                )}
                                <p className="text-xs text-text-tertiary mt-1">
                                  School: {teacher.schoolName}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs bg-success-light text-success px-2 py-1 rounded-full font-mono">
                                  {teacher.schoolCode}
                                </span>
                                <p className="text-xs text-text-tertiary mt-1">
                                  Joined: {new Date(teacher.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Students List */}
                  {activeModal === 'students' && (
                    filteredStudents.length === 0 ? (
                      <p className="text-center text-text-tertiary py-8">No students found</p>
                    ) : (
                      <div className="space-y-3">
                        {filteredStudents.map((student) => (
                          <div key={student.id} className="bg-stone-50 rounded-[12px] p-4 border border-border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-text-primary">{student.email || 'No email'}</p>
                                {student.phone && (
                                  <p className="text-sm text-text-secondary">{student.phone}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-text-tertiary">
                                  Joined: {new Date(student.createdAt).toLocaleDateString()}
                                </p>
                                {student.lastSignIn && (
                                  <p className="text-xs text-text-tertiary">
                                    Last login: {new Date(student.lastSignIn).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Active PINs List */}
                  {activeModal === 'activePINs' && (
                    filteredActivePINs.length === 0 ? (
                      <p className="text-center text-text-tertiary py-8">No schools with active PINs</p>
                    ) : (
                      <div className="space-y-3">
                        {filteredActivePINs.map((school) => (
                          <div key={school.schoolId} className="bg-stone-50 rounded-[12px] p-4 border border-border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-text-primary">{school.schoolName}</p>
                                <p className="text-sm text-text-secondary">{school.districtName}</p>
                              </div>
                              <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded-full font-mono">
                                {school.schoolCode}
                              </span>
                            </div>
                            {school.lastRotatedAt && (
                              <p className="text-xs text-text-tertiary mt-2">
                                Last rotated: {new Date(school.lastRotatedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Inactive PINs List */}
                  {activeModal === 'inactivePINs' && (
                    filteredInactivePINs.length === 0 ? (
                      <p className="text-center text-text-tertiary py-8">All schools have active PINs</p>
                    ) : (
                      <div className="space-y-3">
                        {filteredInactivePINs.map((school) => (
                          <div key={school.id} className="bg-stone-50 rounded-[12px] p-4 border border-border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-text-primary">{school.schoolName}</p>
                                <p className="text-sm text-text-secondary">{school.district}</p>
                              </div>
                              <span className="text-xs bg-border-light text-text-secondary px-2 py-1 rounded-full font-mono">
                                {school.schoolCode}
                              </span>
                            </div>
                            <p className="text-xs text-error mt-2">No PIN configured</p>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-stone-50">
              <Button onClick={closeModal} className="w-full" variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
