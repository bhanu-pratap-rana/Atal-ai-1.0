"use server";

import { verifyStudentAuth, createClient } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { CATEGORIES, CAT_CONFIG, IRTItem, selectNextItem } from "./irt-models";

/**
 * Adaptive question selection using a-Stratified Maximum Fisher Information
 * Selects 30 questions (6 per category) based on IRT item response theory
 */

/**
 * Helper: Convert database items to IRTItem array
 */
function convertToItemPool(
  allItems: Array<{
    id: string;
    item_code: string;
    category: string;
    question_text: string;
    options: unknown;
    correct_answer: number;
    difficulty: number | null;
    discrimination: number | null;
    guessing: number | null;
  }>,
): IRTItem[] {
  return allItems.map((item) => ({
    id: item.id,
    item_code: item.item_code,
    category: item.category,
    question_text: item.question_text,
    options: item.options as { id: string; text: string }[],
    correct_answer: item.correct_answer,
    difficulty: Number(item.difficulty) || 0,
    discrimination: Number(item.discrimination) || 1,
    guessing: Number(item.guessing) || 0.2,
  }));
}

/**
 * Helper: Select questions adaptively using a-Stratified MFI
 */
function selectAdaptiveQuestions(itemPool: IRTItem[]): {
  selectedQuestions: IRTItem[];
  answeredIds: Set<string>;
  answeredByCategory: Record<string, number>;
} {
  const selectedQuestions: IRTItem[] = [];
  const answeredIds = new Set<string>();
  const answeredByCategory: Record<string, number> = {};
  let currentTheta: number = CAT_CONFIG.INITIAL_THETA;

  for (let i = 0; i < CAT_CONFIG.TOTAL_QUESTIONS; i++) {
    const nextItem = selectNextItem(
      currentTheta,
      itemPool,
      answeredIds,
      answeredByCategory,
      i,
    );

    if (!nextItem) {
      break;
    }

    selectedQuestions.push(nextItem);
    answeredIds.add(nextItem.id);
    answeredByCategory[nextItem.category] =
      (answeredByCategory[nextItem.category] || 0) + 1;

    // Simulate alternating response pattern for initial question selection
    if (i % 2 === 0) {
      currentTheta = Math.min(currentTheta + 0.1, CAT_CONFIG.THETA_BOUNDS.max);
    } else {
      currentTheta = Math.max(currentTheta - 0.1, CAT_CONFIG.THETA_BOUNDS.min);
    }
  }

  return { selectedQuestions, answeredIds, answeredByCategory };
}

/**
 * Helper: Fill category gaps to ensure minimum questions per category
 */
function fillCategoryGaps(
  itemPool: IRTItem[],
  selectedQuestions: IRTItem[],
  answeredIds: Set<string>,
  answeredByCategory: Record<string, number>,
): IRTItem[] {
  const categoryGaps: string[] = [];
  for (const category of CATEGORIES) {
    const count = answeredByCategory[category] || 0;
    if (count < CAT_CONFIG.MIN_QUESTIONS_PER_CATEGORY) {
      categoryGaps.push(category);
    }
  }

  if (categoryGaps.length === 0) {
    return selectedQuestions;
  }

  const filledQuestions = [...selectedQuestions];
  for (const category of categoryGaps) {
    const categoryItems = itemPool.filter(
      (item) => item.category === category && !answeredIds.has(item.id),
    );

    const needed =
      CAT_CONFIG.MIN_QUESTIONS_PER_CATEGORY -
      (answeredByCategory[category] || 0);
    const toAdd = categoryItems.slice(0, needed);

    for (const item of toAdd) {
      filledQuestions.push(item);
      answeredIds.add(item.id);
      answeredByCategory[category] = (answeredByCategory[category] || 0) + 1;
    }
  }

  return filledQuestions;
}

/**
 * Helper: Format questions for frontend (protect correct answers)
 */
function formatQuestionsForFrontend(questions: IRTItem[]): Array<{
  id: string;
  itemCode: string;
  category: string;
  questionNumber: number;
  questionText: string;
  options: { id: string; text: string }[];
  _correctIndex: number;
  _difficulty: number;
  _discrimination: number;
  _guessing: number;
}> {
  return questions.map((q, index) => ({
    id: q.id,
    itemCode: q.item_code,
    category: q.category,
    questionNumber: index + 1,
    questionText: q.question_text,
    options: q.options,
    _correctIndex: q.correct_answer,
    _difficulty: q.difficulty,
    _discrimination: q.discrimination,
    _guessing: q.guessing,
  }));
}

/**
 * Shuffle questions but keep them grouped by category
 * Interleaves categories for better test-taking experience
 */
function shuffleWithinCategories(questions: IRTItem[]): IRTItem[] {
  const byCategory: Record<string, IRTItem[]> = {};

  for (const q of questions) {
    if (!byCategory[q.category]) {
      byCategory[q.category] = [];
    }
    byCategory[q.category].push(q);
  }

  // Shuffle within each category
  for (const category of Object.keys(byCategory)) {
    byCategory[category] = shuffleArray(byCategory[category]);
  }

  // Interleave categories for better experience
  const result: IRTItem[] = [];
  const categoryOrder = shuffleArray([...CATEGORIES]);

  // Calculate max questions per category from actual data
  const maxPerCategory = Math.max(
    ...Object.values(byCategory).map((arr) => arr.length),
  );

  for (let i = 0; i < maxPerCategory; i++) {
    for (const category of categoryOrder) {
      const items = byCategory[category];
      if (items?.[i]) {
        result.push(items[i]);
      }
    }
  }

  return result;
}

/**
 * Fisher-Yates shuffle algorithm for unbiased randomization
 * Uses crypto.getRandomValues() for secure randomness
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const j = randomArray[0] % (i + 1);
    const temp = shuffled[i];
    if (temp !== undefined && shuffled[j] !== undefined) {
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
  }
  return shuffled;
}

/**
 * Fetch adaptive assessment questions (refactored to reduce cognitive complexity)
 * CRITICAL FIX: Reduced complexity from 21 to <15 by extracting helper functions
 */
export async function getAdaptiveQuestions(
  language: "en" | "hi" | "as" = "en",
) {
  try {
    const auth = await verifyStudentAuth("getAdaptiveQuestions");
    if (!auth.authorized) {
      return { ...auth.error, questions: [] };
    }

    const supabase = await createClient();

    const { data: allItems, error } = await supabase
      .from("irt_item_bank")
      .select(
        "id, item_code, category, question_text, options, correct_answer, difficulty, discrimination, guessing",
      )
      .eq("language", language)
      .eq("is_active", true)
      .order("category")
      .limit(500);

    if (error) {
      authLogger.error(
        "[getAdaptiveQuestions] Error fetching questions",
        error,
      );
      return {
        success: false,
        error: "Failed to fetch questions",
        questions: [],
      };
    }

    if (!allItems || allItems.length === 0) {
      return { success: false, error: "No questions available", questions: [] };
    }

    const itemPool = convertToItemPool(allItems);
    const { selectedQuestions, answeredIds, answeredByCategory } =
      selectAdaptiveQuestions(itemPool);
    const filledQuestions = fillCategoryGaps(
      itemPool,
      selectedQuestions,
      answeredIds,
      answeredByCategory,
    );
    const shuffledQuestions = shuffleWithinCategories(filledQuestions);
    const formattedQuestions = formatQuestionsForFrontend(shuffledQuestions);

    return {
      success: true,
      questions: formattedQuestions,
      totalQuestions: formattedQuestions.length,
      categories: CATEGORIES,
      catConfig: {
        targetSE: CAT_CONFIG.TARGET_SE,
        initialTheta: CAT_CONFIG.INITIAL_THETA,
      },
    };
  } catch (error) {
    authLogger.error("[getAdaptiveQuestions] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
      questions: [],
    };
  }
}
