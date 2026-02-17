/**
 * IRT (Item Response Theory) 3PL Model Implementation
 *
 * Implements 3-Parameter Logistic (3PL) IRT model for adaptive testing
 * Based on: Lord (1980), Bock & Mislevy (1982), Chang & Ying (1999)
 *
 * Key Components:
 * - 3PL probability function
 * - Fisher Information for item precision measurement
 * - Newton-Raphson MLE for ability estimation
 * - a-Stratification for balanced item exposure control
 */

// IRT 3PL Model Types
export interface IRTItem {
  id: string;
  item_code: string;
  category: string;
  question_text: string;
  options: { id: string; text: string }[];
  correct_answer: number;
  difficulty: number; // b parameter (-3 to +3)
  discrimination: number; // a parameter (0.5 to 2.5)
  guessing: number; // c parameter (0 to 0.5)
}

// Assessment categories - 5 digital literacy domains
export const CATEGORIES = [
  "contextual_application",
  "digital_content_creation",
  "digital_device_familiarity",
  "internet_web_awareness",
  "problem_solving_aptitude",
] as const;

// CAT Configuration following best practices
export const CAT_CONFIG = {
  QUESTIONS_PER_CATEGORY: 6, // Questions to select per category
  TOTAL_QUESTIONS: 30, // 6 per category × 5 categories
  MIN_QUESTIONS_PER_CATEGORY: 4, // Minimum for content validity
  TARGET_SE: 0.35, // Standard error threshold for precision
  INITIAL_THETA: 0, // Start at average ability
  THETA_BOUNDS: { min: -4, max: 4 }, // Ability estimate bounds
  A_STRATIFICATION_LAYERS: 3, // For balanced item selection
} as const;

/**
 * 3PL IRT probability function
 * P(correct) = c + (1-c) / (1 + exp(-a*(theta-b)))
 *
 * Based on Lord (1980) and best practices from PMC research
 *
 * @param theta - Student ability estimate (-4 to +4)
 * @param a - Item discrimination parameter (0.5 to 2.5)
 * @param b - Item difficulty parameter (-3 to +3)
 * @param c - Guessing parameter (0 to 0.5)
 * @returns Probability of correct response (0 to 1)
 */
export function probability3PL(
  theta: number,
  a: number,
  b: number,
  c: number,
): number {
  const exp_term = Math.exp(-a * (theta - b));
  return c + (1 - c) / (1 + exp_term);
}

/**
 * Fisher Information for 3PL model
 * I(theta) = a^2 * (P - c)^2 * Q / ((1 - c)^2 * P)
 *
 * Higher information = more precision at that ability level
 * Used for Maximum Fisher Information (MFI) item selection
 *
 * @param theta - Student ability estimate
 * @param a - Item discrimination
 * @param b - Item difficulty
 * @param c - Guessing parameter
 * @returns Information value (higher = more precise measurement)
 */
export function fisherInformation(
  theta: number,
  a: number,
  b: number,
  c: number,
): number {
  const P = probability3PL(theta, a, b, c);
  const Q = 1 - P;
  if (P <= c || P >= 1) return 0;
  return (a * a * Math.pow(P - c, 2) * Q) / (Math.pow(1 - c, 2) * P);
}

/**
 * a-Stratification for balanced item selection
 * Prevents "greedy" selection of only high-discrimination items
 * Based on Chang & Ying (1999) and PMC research on exposure control
 *
 * @param items - Pool of items to stratify
 * @param layers - Number of stratification layers (typically 3)
 * @returns Items grouped by discrimination parameter into strata
 */
export function stratifyByDiscrimination(
  items: IRTItem[],
  layers: number = 3,
): IRTItem[][] {
  const sorted = [...items].sort((a, b) => a.discrimination - b.discrimination);
  const layerSize = Math.ceil(sorted.length / layers);
  const strata: IRTItem[][] = [];

  for (let i = 0; i < layers; i++) {
    strata.push(sorted.slice(i * layerSize, (i + 1) * layerSize));
  }

  return strata;
}

/**
 * Update ability estimate using Newton-Raphson Maximum Likelihood Estimation
 *
 * Based on Bock & Mislevy (1982) and standard IRT estimation procedures
 * Iteratively refines theta based on observed responses using MLE
 *
 * @param currentTheta - Current ability estimate
 * @param responses - Array of item responses with correct/incorrect flags
 * @returns Updated theta and standard error
 */
export function updateTheta(
  currentTheta: number,
  responses: { item: IRTItem; correct: boolean }[],
): { theta: number; se: number } {
  if (responses.length === 0) {
    return { theta: CAT_CONFIG.INITIAL_THETA, se: 1 };
  }

  let theta = currentTheta;
  const maxIterations = 25;
  const tolerance = 0.001;

  for (let iter = 0; iter < maxIterations; iter++) {
    let firstDerivative = 0;
    let secondDerivative = 0;

    for (const { item, correct } of responses) {
      const a = item.discrimination;
      const b = item.difficulty;
      const c = item.guessing;

      const P = probability3PL(theta, a, b, c);
      const Q = 1 - P;
      const W = (P - c) / (1 - c);

      // First derivative of log-likelihood
      const u = correct ? 1 : 0;
      firstDerivative += (a * W * (u - P)) / P;

      // Second derivative (negative of Fisher information)
      secondDerivative -= (a * a * W * W * Q) / P;
    }

    // Avoid division by zero
    if (Math.abs(secondDerivative) < 0.0001) break;

    // Newton-Raphson update
    const delta = firstDerivative / -secondDerivative;
    theta += delta;

    // Bound theta to prevent extreme estimates
    theta = Math.max(
      CAT_CONFIG.THETA_BOUNDS.min,
      Math.min(CAT_CONFIG.THETA_BOUNDS.max, theta),
    );

    // Check convergence
    if (Math.abs(delta) < tolerance) break;
  }

  // Calculate standard error from test information
  let totalInfo = 0;
  for (const { item } of responses) {
    totalInfo += fisherInformation(
      theta,
      item.discrimination,
      item.difficulty,
      item.guessing,
    );
  }
  const se = totalInfo > 0 ? 1 / Math.sqrt(totalInfo) : 1;

  return { theta, se };
}

/**
 * Select next item for adaptive testing using Maximum Fisher Information (MFI)
 * with a-Stratification for balanced item exposure
 *
 * Strategy:
 * 1. Enforce category balance (don't exceed QUESTIONS_PER_CATEGORY per category)
 * 2. Among eligible items, select from stratified layers to prevent greedy high-discrimination selection
 * 3. Use Maximum Fisher Information within each stratum
 *
 * Based on best practices from Chang & Ying (1999) and PMC research
 *
 * @param currentTheta - Current ability estimate
 * @param itemPool - Pool of available items
 * @param answeredIds - Set of already answered question IDs
 * @param answeredByCategory - Count of answered items per category
 * @param questionIndex - Current question index in assessment
 * @returns Selected item or null if no valid items remain
 */
export function selectNextItem(
  currentTheta: number,
  itemPool: IRTItem[],
  answeredIds: Set<string>,
  answeredByCategory: Record<string, number>,
  _questionIndex: number,
): IRTItem | null {
  // Filter out already answered items
  const remainingItems = itemPool.filter((item) => !answeredIds.has(item.id));

  if (remainingItems.length === 0) return null;

  // Filter by category balance - prefer categories with fewer questions answered
  const itemsByCategory: Record<string, IRTItem[]> = {};
  for (const category of CATEGORIES) {
    const answered = answeredByCategory[category] || 0;
    if (answered < CAT_CONFIG.QUESTIONS_PER_CATEGORY) {
      itemsByCategory[category] = remainingItems.filter(
        (item) => item.category === category,
      );
    }
  }

  // Combine all eligible items from balanced categories
  const balancedItems = Object.values(itemsByCategory).flat();

  if (balancedItems.length === 0) {
    // If category balance prevents selection, allow selection from any category
    // This can happen near the end of assessment
    return selectByFisherInformation(currentTheta, remainingItems);
  }

  // Use a-Stratification for balanced discrimination selection
  const strata = stratifyByDiscrimination(
    balancedItems,
    CAT_CONFIG.A_STRATIFICATION_LAYERS,
  );

  // Select from middle stratum to avoid always picking highest discrimination items
  // This prevents overexposure of high-discrimination items
  const middleStratumIndex = Math.floor(strata.length / 2);
  const selectedStratum = strata[middleStratumIndex] || strata[0];

  if (selectedStratum.length === 0) {
    // Fallback: select from all strata if selected stratum is empty
    return selectByFisherInformation(currentTheta, balancedItems);
  }

  return selectByFisherInformation(currentTheta, selectedStratum);
}

/**
 * Helper: Select item with maximum Fisher Information
 * @param theta - Current ability estimate
 * @param items - Pool of items to select from
 * @returns Item with maximum information at current theta level
 */
function selectByFisherInformation(
  theta: number,
  items: IRTItem[],
): IRTItem | null {
  if (items.length === 0) return null;

  let bestItem = items[0];
  let maxInfo = fisherInformation(
    theta,
    items[0].discrimination,
    items[0].difficulty,
    items[0].guessing,
  );

  for (let i = 1; i < items.length; i++) {
    const info = fisherInformation(
      theta,
      items[i].discrimination,
      items[i].difficulty,
      items[i].guessing,
    );
    if (info > maxInfo) {
      maxInfo = info;
      bestItem = items[i];
    }
  }

  return bestItem;
}
