"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import {
  LogOut,
  ArrowLeft,
  Database,
  Search,
  RefreshCw,
  Filter,
  AlertCircle,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { clientLogger } from "@/lib/client-logger";
import { cn } from "@/lib/utils";

interface IRTQuestion {
  id: string;
  item_code: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer: number;
  category: string;
  level: string;
  language: string;
  difficulty: number;
  discrimination: number;
  guessing: number;
  is_active: boolean | null;
  times_administered: number | null;
  times_correct: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * IRT Item Bank Admin Page
 *
 * Allows admins to view, search, and edit IRT item bank questions.
 * Features:
 * - Search by question text or item code
 * - Filter by category, level, language
 * - Edit IRT parameters (difficulty, discrimination, guessing)
 * - Toggle active status
 *
 * Security: Only accessible by admin/super_admin users (RLS enforced)
 */
export default function IRTItemBankAdminPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<IRTQuestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchQuestions = useCallback(async () => {
    try {
      let query = supabase
        .from("irt_item_bank")
        .select(
          "id, item_code, question_text, options, correct_answer, category, level, language, difficulty, discrimination, guessing, is_active, times_administered, times_correct, created_at, updated_at"
        )
        .order("item_code");

      // Apply filters
      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }
      if (selectedLevel) {
        query = query.eq("level", selectedLevel);
      }
      if (selectedLanguage) {
        query = query.eq("language", selectedLanguage);
      }

      const { data, error: fetchError } = await query.limit(100);

      if (fetchError) {
        throw fetchError;
      }

      setQuestions(data || []);
      setError(null);
    } catch (err) {
      clientLogger.error("[IRTAdmin] Error fetching questions", err instanceof Error ? err : { err });
      setError("Failed to load questions. Please try again.");
    }
  }, [supabase, selectedCategory, selectedLevel, selectedLanguage]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email) {
          router.push("/admin/login");
          return;
        }

        // Check admin role
        const role = user.app_metadata?.role;
        if (
          typeof role !== "string" ||
          !["admin", "super_admin"].includes(role)
        ) {
          clientLogger.warn("[IRTAdmin] Non-admin access attempt", { role });
          router.push("/admin/login");
          return;
        }

        setUserEmail(user.email);
        await fetchQuestions();
      } catch (err) {
        clientLogger.error("[IRTAdmin] Auth check failed", err instanceof Error ? err : { err });
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router, supabase, fetchQuestions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchQuestions();
    setIsRefreshing(false);
  };

  const handleUpdateQuestion = async (
    questionId: string,
    updates: Partial<
      Pick<IRTQuestion, "difficulty" | "discrimination" | "guessing" | "is_active">
    >
  ) => {
    try {
      const { error: updateError } = await supabase
        .from("irt_item_bank")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", questionId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, ...updates, updated_at: new Date().toISOString() }
            : q
        )
      );

      clientLogger.info("[IRTAdmin] Question updated", { questionId, updates });
    } catch (err) {
      clientLogger.error("[IRTAdmin] Error updating question", err instanceof Error ? err : { err });
      throw err;
    }
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  // Filter questions by search query
  const filteredQuestions = questions.filter(
    (q) =>
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.item_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique filter values
  const categories = Array.from(new Set(questions.map((q) => q.category)));
  const levels = Array.from(new Set(questions.map((q) => q.level)));
  const languages = Array.from(new Set(questions.map((q) => q.language)));

  // Stats
  const activeCount = questions.filter((q) => q.is_active !== false).length;
  const totalCount = questions.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-secondary">Loading item bank...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {/* Logo */}
            <div className="w-10 h-10 flex-shrink-0">
              <Image
                src="/assets/logo.png"
                alt="ATAL AI Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain rounded-full"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text">IRT Item Bank</h1>
                <div className="bg-secondary/10 p-1.5 rounded-lg">
                  <Database className="w-4 h-4 text-secondary" />
                </div>
              </div>
              <p className="text-sm text-text-secondary">
                Manage assessment questions and IRT parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">{userEmail}</span>
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="text-2xl font-bold text-text">{totalCount}</div>
            <div className="text-sm text-text-secondary">Total Questions</div>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="text-2xl font-bold text-success">{activeCount}</div>
            <div className="text-sm text-text-secondary">Active</div>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="text-2xl font-bold text-text-tertiary">
              {totalCount - activeCount}
            </div>
            <div className="text-sm text-text-secondary">Inactive</div>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="text-2xl font-bold text-primary">
              {categories.length}
            </div>
            <div className="text-sm text-text-secondary">Categories</div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-error/10 border border-error/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
            <p className="text-error">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <Input
                placeholder="Search by question or item code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-tertiary" />
              <select
                value={selectedCategory || ""}
                onChange={(e) =>
                  setSelectedCategory(e.target.value || null)
                }
                className="text-sm border border-border rounded px-2 py-1"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <select
              value={selectedLevel || ""}
              onChange={(e) => setSelectedLevel(e.target.value || null)}
              className="text-sm border border-border rounded px-2 py-1"
            >
              <option value="">All Levels</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            {/* Language Filter */}
            <select
              value={selectedLanguage || ""}
              onChange={(e) => setSelectedLanguage(e.target.value || null)}
              className="text-sm border border-border rounded px-2 py-1"
            >
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white border border-border rounded-lg p-8 text-center">
              <Database className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <h3 className="text-lg font-medium text-text mb-1">
                {searchQuery ? "No questions found" : "No questions"}
              </h3>
              <p className="text-text-secondary">
                {searchQuery
                  ? `No questions match "${searchQuery}"`
                  : "Questions will appear here once added to the item bank."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-text-secondary mb-2">
                Showing {filteredQuestions.length} of {totalCount} questions
              </p>
              {filteredQuestions.map((question) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  onUpdate={handleUpdateQuestion}
                />
              ))}
            </>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-secondary/5 border border-secondary/20 rounded-lg p-6">
          <h3 className="font-semibold text-secondary mb-2">
            About IRT Parameters
          </h3>
          <ul className="text-sm text-text-secondary space-y-2 list-disc list-inside">
            <li>
              <strong>Difficulty (b):</strong> How hard the question is. Range:
              -3 (very easy) to +3 (very hard)
            </li>
            <li>
              <strong>Discrimination (a):</strong> How well the question
              separates high and low ability students. Range: 0 to 3
            </li>
            <li>
              <strong>Guessing (c):</strong> Probability of guessing correctly.
              For 4 options: typically 0.25
            </li>
            <li>
              Changes to IRT parameters affect adaptive testing and score
              calculations
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
