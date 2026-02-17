/**
 * Language Detection Utility
 *
 * Detects the language of text based on:
 * 1. Unicode character ranges (Devanagari, Bengali/Assamese)
 * 2. Romanized language keywords ("hindi mein", "assamese mein", etc.)
 * 3. Language switch requests
 *
 * Priority: Assamese > Hindi > English
 */

export type DetectedLanguage = "en" | "hi" | "as";

// Unicode ranges for script detection
const DEVANAGARI_RANGE = /[\u0900-\u097F]/g; // Hindi
const BENGALI_ASSAMESE_RANGE = /[\u0980-\u09FF]/g; // Assamese/Bengali
const LATIN_RANGE = /[a-zA-Z]/g; // English

// Romanized keywords for language detection (case-insensitive)
// Priority: Assamese keywords checked FIRST
const ASSAMESE_KEYWORDS = [
  // Direct language requests (Romanized)
  "assamese mein", "assamese me", "assamese main",
  "asomiya mein", "asomiya me", "asomiya main",
  "oxomiya mein", "oxomiya me", "oxomiya main",
  "axomiya mein", "axomiya me", "axomiya main",
  // Language switch requests
  "speak assamese", "talk assamese", "reply assamese",
  "speak in assamese", "talk in assamese", "reply in assamese",
  "answer assamese", "answer in assamese",
  "baat karo assamese", "jawab do assamese",
  // Native script keywords
  "অসমীয়া", "অসমীয়াত",
];

const HINDI_KEYWORDS = [
  // Direct language requests (Romanized)
  "hindi mein", "hindi me", "hindi main",
  "hinglish",
  // Language switch requests
  "speak hindi", "talk hindi", "reply hindi",
  "speak in hindi", "talk in hindi", "reply in hindi",
  "answer hindi", "answer in hindi",
  "baat karo hindi", "jawab do hindi",
  // Native script keywords
  "हिंदी", "हिंदी में",
];

/**
 * Check if text contains language switch request
 * Returns the requested language or null
 *
 * PRIORITY: Assamese > Hindi (to give Assamese higher priority)
 */
function detectLanguageRequest(text: string): DetectedLanguage | null {
  const lowerText = text.toLowerCase();

  // Check Assamese keywords FIRST (higher priority)
  for (const keyword of ASSAMESE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return "as";
    }
  }

  // Then check Hindi keywords
  for (const keyword of HINDI_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return "hi";
    }
  }

  return null;
}

/**
 * Detects the language of the given text.
 *
 * Detection order:
 * 1. Check for explicit language switch requests (Romanized keywords)
 * 2. Check for native scripts (Devanagari, Bengali/Assamese)
 * 3. Default to English
 *
 * Priority: Assamese > Hindi > English
 *
 * @param text - The text to analyze
 * @returns The detected language code ('en', 'hi', or 'as')
 */
export function detectLanguage(text: string): DetectedLanguage {
  if (!text || text.trim().length === 0) {
    return "en"; // Default to English for empty text
  }

  // STEP 1: Check for explicit language switch requests (Romanized text)
  // This handles "hindi mein baat karo", "assamese mein jawab do", etc.
  const requestedLang = detectLanguageRequest(text);
  if (requestedLang) {
    return requestedLang;
  }

  // STEP 2: Count characters from each script
  const devanagariCount = (text.match(DEVANAGARI_RANGE) || []).length;
  const bengaliAssameseCount = (text.match(BENGALI_ASSAMESE_RANGE) || []).length;
  const latinCount = (text.match(LATIN_RANGE) || []).length;

  // Total script characters
  const total = devanagariCount + bengaliAssameseCount + latinCount;

  // If no script characters detected, default to English
  if (total === 0) {
    return "en";
  }

  // STEP 3: Determine predominant script with ASSAMESE PRIORITY
  // If Assamese/Bengali characters are present (even small amount), prefer Assamese
  if (bengaliAssameseCount > 0 && bengaliAssameseCount > latinCount * 0.1) {
    return "as";
  }

  // If Hindi (Devanagari) characters are present
  if (devanagariCount > 0 && devanagariCount > latinCount * 0.1) {
    return "hi";
  }

  // Default to English
  return "en";
}

/**
 * Gets the speech recognition language code for a detected language.
 *
 * @param lang - The detected language
 * @returns The BCP-47 language tag for speech recognition
 */
export function getSpeechRecognitionLang(lang: DetectedLanguage): string {
  switch (lang) {
    case "hi":
      return "hi-IN";
    case "as":
      return "as-IN";
    case "en":
    default:
      return "en-IN";
  }
}

/**
 * Gets the speech synthesis language code for a detected language.
 *
 * @param lang - The detected language
 * @returns The BCP-47 language tag for speech synthesis
 */
export function getSpeechSynthesisLang(lang: DetectedLanguage): string {
  switch (lang) {
    case "hi":
      return "hi-IN";
    case "as":
      return "as-IN";
    case "en":
    default:
      return "en-IN";
  }
}

/**
 * Checks if a text contains primarily Indic scripts (Hindi or Assamese).
 * Useful for quick checks before full language detection.
 *
 * @param text - The text to check
 * @returns True if the text contains Indic script characters
 */
export function containsIndicScript(text: string): boolean {
  return DEVANAGARI_RANGE.test(text) || BENGALI_ASSAMESE_RANGE.test(text);
}
