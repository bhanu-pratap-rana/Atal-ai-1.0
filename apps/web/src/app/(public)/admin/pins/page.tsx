"use client";
export const dynamic = "force-dynamic";

import { Loader } from "lucide-react";
import { usePINManagement } from "@/hooks/usePINManagement";
import { PINManagementHeader } from "@/components/admin/pins/PINManagementHeader";
import { StatisticsDashboard } from "@/components/admin/pins/StatisticsDashboard";
import { SchoolSearchBar } from "@/components/admin/pins/SchoolSearchBar";
import { SchoolDetailCard } from "@/components/admin/pins/SchoolDetailCard";
import { PINGenerator } from "@/components/admin/pins/PINGenerator";
import { QuickGuideCard } from "@/components/admin/pins/QuickGuideCard";
import { SchoolsList } from "@/components/admin/pins/SchoolsList";

export default function AdminSchoolPINsPage() {
  const {
    isLoading,
    isSuperAdmin,
    searchQuery,
    allSchools,
    filteredSchools,
    stats,
    selectedSchool,
    rotatingId,
    showNewPin,
    newPin,
    loadingSchoolDetails,
    showSuggestions,
    copied,
    searchInputRef,
    setSearchQuery,
    setShowNewPin,
    setCopied,
    handleSelectSchool,
    handleSignOut,
    handleGenerateRandomPin,
    handleRotatePin,
    copyPinToClipboard,
    navigateToDashboard,
  } = usePINManagement();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader size={32} className="animate-spin text-primary" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <PINManagementHeader
        isSuperAdmin={isSuperAdmin}
        onSignOut={handleSignOut}
        onDashboardClick={navigateToDashboard}
      />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Statistics */}
        <StatisticsDashboard stats={stats} />

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6 min-h-[600px]">
          {/* Left Column: Search & Details */}
          <div className="col-span-2 space-y-6">
            {/* Step 1: Search */}
            <div>
              <h2 className="text-lg font-semibold text-text mb-3">
                Step 1: Find School
              </h2>
              <SchoolSearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filteredSchools={filteredSchools}
                showSuggestions={showSuggestions}
                onSelectSchool={handleSelectSchool}
                loadingSchoolDetails={loadingSchoolDetails}
                searchInputRef={searchInputRef}
              />
            </div>

            {/* Step 2: Details or Guide */}
            {selectedSchool ? (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-text mb-3">
                    Step 2: PIN Status
                  </h2>
                  <SchoolDetailCard
                    school={selectedSchool}
                    onCopyCode={async () => {
                      // ERR-006 FIX: Add error handling for clipboard API
                      try {
                        await navigator.clipboard.writeText(
                          selectedSchool.schoolCode,
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      } catch {
                        // Clipboard API may fail in certain environments
                      }
                    }}
                    copied={copied}
                  />
                </div>

                {/* Step 3: PIN Management */}
                <div>
                  <h2 className="text-lg font-semibold text-text mb-3">
                    Step 3: Generate/Rotate PIN
                  </h2>
                  <PINGenerator
                    selectedSchool={selectedSchool}
                    newPin={newPin}
                    showNewPin={showNewPin}
                    onShowNewPinChange={setShowNewPin}
                    onGeneratePin={handleGenerateRandomPin}
                    onRotatePin={handleRotatePin}
                    onCopyPin={copyPinToClipboard}
                    rotatingId={rotatingId}
                    copied={copied}
                  />
                </div>
              </>
            ) : (
              <QuickGuideCard />
            )}
          </div>

          {/* Right Column: Schools List */}
          <div className="bg-white border border-border rounded-lg overflow-hidden flex flex-col">
            <SchoolsList
              schools={allSchools}
              selectedSchool={selectedSchool}
              onSelectSchool={handleSelectSchool}
              isLoading={loadingSchoolDetails}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
