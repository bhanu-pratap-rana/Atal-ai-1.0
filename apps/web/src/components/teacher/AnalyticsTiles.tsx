'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsTilesProps {
  activeThisWeek: number
  avgMinutesPerDay: number
  atRiskCount: number
}

export function AnalyticsTiles({
  activeThisWeek,
  avgMinutesPerDay,
  atRiskCount,
}: AnalyticsTilesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* Active This Week */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className="text-green-700 font-medium">
              Active This Week
            </CardDescription>
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-4xl font-bold text-green-700">
              {activeThisWeek}
            </div>
            <p className="text-sm text-green-600">
              {activeThisWeek === 1 ? 'student' : 'students'} completed assessments
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Avg Minutes Per Day */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className="text-blue-700 font-medium">
              Avg Minutes/Day
            </CardDescription>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-4xl font-bold text-blue-700">
              {avgMinutesPerDay.toFixed(1)}
            </div>
            <p className="text-sm text-blue-600">
              minutes per student per day
            </p>
          </div>
        </CardContent>
      </Card>

      {/* At-Risk Students */}
      <Card className={`border-2 ${atRiskCount > 0 ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className={atRiskCount > 0 ? 'text-amber-700 font-medium' : 'text-gray-700 font-medium'}>
              At-Risk Students
            </CardDescription>
            <div className={`w-10 h-10 ${atRiskCount > 0 ? 'bg-amber-500' : 'bg-gray-400'} rounded-full flex items-center justify-center`}>
              <span className="text-2xl">{atRiskCount > 0 ? '⚠️' : '✅'}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className={`text-4xl font-bold ${atRiskCount > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
              {atRiskCount}
            </div>
            <p className={`text-sm ${atRiskCount > 0 ? 'text-amber-600' : 'text-gray-600'}`}>
              {atRiskCount === 0 ? 'All students engaged' : 'with >30% rapid guessing'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
