"use client";

import React, { useEffect, useState } from "react";
import type { DashboardMetrics } from "@/app/actions/admin-metrics";
import {
  getDashboardMetrics,
  getSchoolsWithActivePINs,
  getAllSchools,
  getAllTeachers,
  getAllStudents,
  getSchoolsWithoutPINs,
} from "@/app/actions/admin-metrics";
import { School, Users, Lock, GraduationCap } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";
import { DataModal } from "@/components/admin/modals/DataModal";
import { ListItemCard } from "@/components/admin/modals/ListItemCard";

/**
 * ATAL AI Dashboard Metrics - Jyoti Theme
 *
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 */

type ModalType =
  | "schools"
  | "teachers"
  | "students"
  | "activePINs"
  | "inactivePINs"
  | null;

interface SchoolItem {
  readonly id: string;
  readonly schoolName: string;
  readonly schoolCode: string;
  readonly district: string;
  readonly block?: string | null;
  readonly hasPIN?: boolean;
}

interface TeacherItem {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string | null;
  readonly schoolName: string;
  readonly schoolCode: string;
  readonly createdAt: string;
}

interface StudentItem {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string | null;
  readonly className: string | null;
  readonly schoolName: string | null;
  readonly createdAt: string;
  readonly lastSignIn: string | null;
}

interface ActivePINSchool {
  readonly schoolId: string;
  readonly schoolName: string;
  readonly schoolCode: string;
  readonly districtName: string;
  readonly lastRotatedAt: string | null;
}

type ModalItem = SchoolItem | TeacherItem | StudentItem | ActivePINSchool;

/**
 * Type guard: Get item key based on type
 * Safely accesses either id or schoolId depending on item type
 */
function getItemKey(item: ModalItem): string {
  if ('schoolId' in item) {
    return item.schoolId;
  }
  return item.id;
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Data for modals
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [activePINSchools, setActivePINSchools] = useState<ActivePINSchool[]>(
    [],
  );
  const [inactivePINSchools, setInactivePINSchools] = useState<SchoolItem[]>(
    [],
  );

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const result = await getDashboardMetrics();
        if (result?.success && result?.data) {
          setMetrics(result.data);
        } else {
          setError(result?.error || "Failed to load metrics");
        }
      } catch (error) {
        clientLogger.error(
          "[DashboardMetrics] Failed to load metrics",
          error instanceof Error ? error : { error: String(error) },
        );
        setError("An error occurred while loading metrics");
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, []);

  /**
   * Helper: Load data for a specific modal type
   * Refactored to use async loader functions to reduce cognitive complexity (S3776)
   */
  async function loadModalData(type: ModalType): Promise<void> {
    if (!type) return;

    // Modal data loaders mapped by type
    const loaders: Record<NonNullable<ModalType>, () => Promise<void>> = {
      schools: async () => {
        const result = await getAllSchools();
        if (result?.success && result?.data) setSchools(result.data);
      },
      teachers: async () => {
        const result = await getAllTeachers();
        if (result?.success && result?.data) setTeachers(result.data);
      },
      students: async () => {
        const result = await getAllStudents();
        if (result?.success && result?.data) setStudents(result.data);
      },
      activePINs: async () => {
        const result = await getSchoolsWithActivePINs();
        if (result?.success && result?.data) setActivePINSchools(result.data);
      },
      inactivePINs: async () => {
        const result = await getSchoolsWithoutPINs();
        if (result?.success && result?.data) setInactivePINSchools(result.data);
      },
    };

    await loaders[type]();
  }

  /**
   * Open modal and load data (refactored to reduce cognitive complexity)
   * CRITICAL FIX: Reduced complexity from 17 to <15 by extracting loadModalData helper
   */
  async function openModal(type: ModalType) {
    setActiveModal(type);
    setModalLoading(true);
    setSearchQuery("");

    try {
      await loadModalData(type);
    } catch (error) {
      // Log error for debugging but don't show to user (modal will show empty state)
      clientLogger.error(
        "[DashboardMetrics] Error loading modal data",
        error instanceof Error ? error : { error: String(error) },
      );
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setActiveModal(null);
    setSearchQuery("");
  }

  /**
   * Helper: Get modal title based on type
   */
  function getModalTitle(): string {
    switch (activeModal) {
      case "schools":
        return `All Schools (${filteredSchools.length})`;
      case "teachers":
        return `All Teachers (${filteredTeachers.length})`;
      case "students":
        return `All Students (${filteredStudents.length})`;
      case "activePINs":
        return `Schools with Active PINs (${filteredActivePINs.length})`;
      case "inactivePINs":
        return `Schools without PINs (${filteredInactivePINs.length})`;
      default:
        return "";
    }
  }

  /**
   * Helper: Render modal content based on type
   * Refactored to use ListItemCard component (consolidated 80+ lines)
   */
  function renderModalContent(): React.ReactElement {
    let items: ModalItem[] = [];
    let emptyMessage = "No content";

    switch (activeModal) {
      case "schools":
        items = filteredSchools;
        emptyMessage = "No schools found";
        break;
      case "teachers":
        items = filteredTeachers;
        emptyMessage = "No teachers found";
        break;
      case "students":
        items = filteredStudents;
        emptyMessage = "No students found";
        break;
      case "activePINs":
        items = filteredActivePINs;
        emptyMessage = "No schools with active PINs";
        break;
      case "inactivePINs":
        items = filteredInactivePINs;
        emptyMessage = "All schools have active PINs";
        break;
    }

    return items.length === 0 ? (
      <p className="text-center text-text-tertiary py-8">{emptyMessage}</p>
    ) : (
      <div className="space-y-3">
        {items.map((item) => (
          <ListItemCard
            key={getItemKey(item)}
            item={item}
            modalType={activeModal}
          />
        ))}
      </div>
    );
  }

  // Filter functions
  const filteredSchools = schools.filter(
    (s) =>
      s.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.schoolCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.district.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.schoolName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery),
  );

  const filteredActivePINs = activePINSchools.filter(
    (s) =>
      s.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.schoolCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredInactivePINs = inactivePINSchools.filter(
    (s) =>
      s.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.schoolCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    // S6479: Index keys are acceptable for static skeleton placeholders
    // These elements have no stable ID, don't reorder, and are temporary
    const skeletonKeys = ["s1", "s2", "s3", "s4", "s5"] as const;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {skeletonKeys.map((key) => (
          <div
            key={key}
            className="bg-border-light rounded-lg p-4 h-24 animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-light border border-error rounded-md p-4">
        <p className="text-sm text-error-dark">{error}</p>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const metricCards = [
    {
      title: "Schools",
      value: metrics.totalSchools,
      icon: School,
      color: "bg-primary-light",
      iconColor: "text-primary",
      hoverColor: "hover:border-primary",
      modalType: "schools" as ModalType,
    },
    {
      title: "Teachers",
      value: metrics.totalTeachers,
      icon: Users,
      color: "bg-success-light",
      iconColor: "text-success",
      hoverColor: "hover:border-success",
      modalType: "teachers" as ModalType,
    },
    {
      title: "Students",
      value: metrics.totalStudents,
      icon: GraduationCap,
      color: "bg-accent-light",
      iconColor: "text-accent-dark",
      hoverColor: "hover:border-accent",
      modalType: "students" as ModalType,
    },
    {
      title: "Active PINs",
      value: metrics.activePins,
      icon: Lock,
      color: "bg-primary-light",
      iconColor: "text-primary",
      hoverColor: "hover:border-primary",
      modalType: "activePINs" as ModalType,
    },
    {
      title: "Inactive PINs",
      value: metrics.inactivePins,
      icon: Lock,
      color: "bg-border-light",
      iconColor: "text-text-tertiary",
      hoverColor: "hover:border-text-tertiary",
      modalType: "inactivePINs" as ModalType,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => openModal(card.modalType)}
              className={`${card.color} rounded-lg p-6 border border-border text-left ${card.hoverColor} hover:shadow-md transition cursor-pointer`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
                <h3 className="text-sm text-text-secondary font-medium">
                  {card.title}
                </h3>
              </div>
              <p className="text-3xl font-bold text-text-primary">
                {card.value}
              </p>
              <p className={`text-xs ${card.iconColor} mt-2 underline`}>
                Click to view
              </p>
            </button>
          );
        })}
      </div>

      {/* Data Display Modal (refactored to use reusable DataModal component) */}
      <DataModal
        isOpen={activeModal !== null}
        title={getModalTitle()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClose={closeModal}
        isLoading={modalLoading}
      >
        {renderModalContent()}
      </DataModal>
    </>
  );
}
