"use client";

/**
 * usePINManagement Custom Hook
 * Extracted from admin/pins/page.tsx to manage PIN management state and handlers
 * Handles school selection, PIN rotation, statistics, and authentication
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";
import {
  getSchoolPINInfo,
  rotateSchoolPIN,
  getAllSchoolsWithPINs,
  getPINStatistics,
} from "@/app/actions/admin-pin-management";
import type {
  SchoolPINInfo,
  SchoolListItem,
  PINStatistics,
} from "@/app/actions/admin-pin-management";
import { clientLogger } from "@/lib/client-logger";
import { CLIPBOARD_TIMING } from "@/lib/constants/ui-timings";
import { PIN_LIMITS } from "@/lib/constants/validation-limits";

export interface UsePINManagementReturn {
  // State
  isLoading: boolean;
  isSuperAdmin: boolean;
  searchQuery: string;
  allSchools: SchoolListItem[];
  filteredSchools: SchoolListItem[];
  stats: PINStatistics | null;
  selectedSchool: SchoolPINInfo | null;
  rotatingId: string | null;
  showNewPin: boolean;
  newPin: string | null;
  loadingSchoolDetails: boolean;
  showSuggestions: boolean;
  copied: boolean;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  // State setters
  setSearchQuery: (query: string) => void;
  setShowSuggestions: (show: boolean) => void;
  setShowNewPin: (show: boolean) => void;
  setCopied: (copied: boolean) => void;

  // Handlers
  handleSelectSchool: (school: SchoolListItem) => Promise<void>;
  handleSignOut: () => Promise<void>;
  handleGenerateRandomPin: () => void;
  handleRotatePin: (customPin?: string) => Promise<void>;
  copyPinToClipboard: () => Promise<void>;
  navigateToDashboard: () => void;
}

/**
 * Generate a random 4-digit PIN using centralized constants
 * Uses crypto.getRandomValues() for secure randomness
 */
function generateRandomPIN(): string {
  const range = PIN_LIMITS.max - PIN_LIMITS.min + 1;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (PIN_LIMITS.min + (array[0] % range)).toString();
}

/**
 * Helper interface for reload state setters
 * Extracted to reduce cognitive complexity (S3776)
 */
interface ReloadDataSetters {
  setAllSchools: (schools: SchoolListItem[]) => void;
  setFilteredSchools: (schools: SchoolListItem[]) => void;
  setStats: (stats: PINStatistics) => void;
  setSelectedSchool: (school: SchoolPINInfo) => void;
}

/**
 * Reload all PIN management data after a successful operation
 * Extracted to reduce cognitive complexity (S3776) of handleRotatePin
 */
async function reloadPINData(
  schoolId: string,
  setters: ReloadDataSetters,
): Promise<void> {
  const schoolsResult = await getAllSchoolsWithPINs();
  if (schoolsResult?.success && Array.isArray(schoolsResult?.data)) {
    setters.setAllSchools(schoolsResult.data as SchoolListItem[]);
    setters.setFilteredSchools(schoolsResult.data as SchoolListItem[]);
  }

  const statsResult = await getPINStatistics();
  if (statsResult?.success && statsResult?.data) {
    setters.setStats(statsResult.data as PINStatistics);
  }

  const detailResult = await getSchoolPINInfo(schoolId);
  if (detailResult?.success && detailResult?.data) {
    setters.setSelectedSchool(detailResult.data as SchoolPINInfo);
  }
}

export function usePINManagement(): UsePINManagementReturn {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(
    null,
  );
  // BUG-011 FIX: Track copy timer for cleanup on unmount
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [allSchools, setAllSchools] = useState<SchoolListItem[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolListItem[]>([]);
  const [stats, setStats] = useState<PINStatistics | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolPINInfo | null>(
    null,
  );
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [showNewPin, setShowNewPin] = useState(false);
  const [newPin, setNewPin] = useState<string | null>(null);
  const [loadingSchoolDetails, setLoadingSchoolDetails] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // BUG-011 FIX: Cleanup copy timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Load page data on mount (also initializes supabase client)
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        // PERF: Create client once and store in ref for reuse (sign out, etc.)
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        supabaseRef.current = supabase;

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email) {
          router.push("/admin/login");
          return;
        }

        // Check if user is super_admin
        const role = user.app_metadata?.role as string;
        setIsSuperAdmin(role === "super_admin");

        // Load all schools
        const schoolsResult = await getAllSchoolsWithPINs();
        if (schoolsResult?.success && Array.isArray(schoolsResult?.data)) {
          setAllSchools(schoolsResult.data as SchoolListItem[]);
          setFilteredSchools(schoolsResult.data as SchoolListItem[]);
        }

        // Load statistics
        const statsResult = await getPINStatistics();
        if (statsResult?.success && statsResult?.data) {
          setStats(statsResult.data as PINStatistics);
        }
      } catch (error) {
        clientLogger.error(
          "[usePINManagement] Error loading data",
          error instanceof Error ? error : { error },
        );
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  // Filter schools as user types (instant suggestions)
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setFilteredSchools(allSchools);
      setShowSuggestions(false);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allSchools.filter(
        (school) =>
          school.schoolName.toLowerCase().includes(query) ||
          school.schoolCode.toLowerCase().includes(query) ||
          school.districtName?.toLowerCase().includes(query),
      );
      setFilteredSchools(filtered);
      setShowSuggestions(true);
    }
  }, [searchQuery, allSchools]);

  /**
   * Load selected school details
   */
  const handleSelectSchool = useCallback(async (school: SchoolListItem) => {
    setLoadingSchoolDetails(true);
    setSelectedSchool(null);
    setNewPin(null);
    setShowNewPin(false);
    setShowSuggestions(false);
    setSearchQuery(school.schoolName);

    try {
      const result = await getSchoolPINInfo(school.schoolId);
      if (result?.success && result?.data) {
        setSelectedSchool(result.data as SchoolPINInfo);
      } else {
        toast.error("Failed to load school details");
      }
    } catch (error) {
      clientLogger.error(
        "[usePINManagement] Error loading school",
        error instanceof Error ? error : { error },
      );
      toast.error("Error loading school details");
    } finally {
      setLoadingSchoolDetails(false);
    }
  }, []);

  /**
   * Sign out current user
   */
  const handleSignOut = useCallback(async () => {
    try {
      if (supabaseRef.current) {
        await supabaseRef.current.auth.signOut();
        router.push("/admin/login");
      }
    } catch (error) {
      clientLogger.error(
        "[usePINManagement] Sign out error",
        error instanceof Error ? error : { error },
      );
      toast.error("Error signing out");
    }
  }, [router]);

  /**
   * Generate a new random PIN
   */
  const handleGenerateRandomPin = useCallback(() => {
    const pin = generateRandomPIN();
    setNewPin(pin);
  }, []);

  /**
   * Rotate PIN and reload data
   * Refactored to use reloadPINData helper to reduce cognitive complexity (S3776)
   */
  const handleRotatePin = useCallback(
    async (customPin?: string) => {
      if (!selectedSchool) return;

      setRotatingId(selectedSchool.schoolId);

      try {
        const pinToRotate = customPin || newPin;
        if (!pinToRotate) {
          toast.error("No PIN to rotate");
          return;
        }

        const result = await rotateSchoolPIN(selectedSchool.schoolId, pinToRotate);

        if (result.success) {
          // Reload all data using extracted helper
          await reloadPINData(selectedSchool.schoolId, {
            setAllSchools,
            setFilteredSchools,
            setStats,
            setSelectedSchool,
          });

          // Display the saved PIN so admin knows what was actually set
          const rotateData = result.data as { newPIN?: string } | undefined;
          const savedPIN = rotateData?.newPIN;
          if (savedPIN) {
            setNewPin(savedPIN);
            setShowNewPin(true);
            toast.success(
              `PIN rotated successfully! New PIN: ${savedPIN} (Click copy button to copy)`,
            );
          } else {
            setNewPin(null);
            setShowNewPin(false);
            toast.success("PIN rotated successfully");
          }
        } else {
          toast.error(result.error || "Failed to rotate PIN");
        }
      } catch (error) {
        clientLogger.error(
          "[usePINManagement] PIN rotation error",
          error instanceof Error ? error : { error },
        );
        toast.error("Error rotating PIN");
      } finally {
        setRotatingId(null);
      }
    },
    [selectedSchool, newPin],
  );

  /**
   * Copy PIN to clipboard with feedback
   */
  const copyPinToClipboard = useCallback(async () => {
    if (!newPin) return;

    try {
      await navigator.clipboard.writeText(newPin);
      setCopied(true);
      // BUG-011 FIX: Store timer ref for cleanup on unmount
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
      }, CLIPBOARD_TIMING.successFeedback);
    } catch (error) {
      clientLogger.error(
        "[usePINManagement] Copy to clipboard error",
        error instanceof Error ? error : { error },
      );
      toast.error("Failed to copy to clipboard");
    }
  }, [newPin]);

  /**
   * Navigate to admin dashboard
   */
  const navigateToDashboard = useCallback(() => {
    router.push("/admin/dashboard");
  }, [router]);

  return {
    // State
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

    // State setters
    setSearchQuery,
    setShowSuggestions,
    setShowNewPin,
    setCopied,

    // Handlers
    handleSelectSchool,
    handleSignOut,
    handleGenerateRandomPin,
    handleRotatePin,
    copyPinToClipboard,
    navigateToDashboard,
  };
}
