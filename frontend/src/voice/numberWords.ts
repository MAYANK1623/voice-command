// Spoken quantities the command processor understands, e.g. "add two
// bananas" or "a dozen eggs" (the leading "a"/"an" resolves to 1; "dozen"
// itself is handled as a *unit*, not a number — see unitSynonyms.ts —
// since the data model stores "1 dozen" rather than "12 pcs").
export const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  // Browser speech recognition very commonly mishears "two" as "to"/"too"
  // (true homophones) — without this, "add two bananas" transcribed as
  // "add to bananas" would create a literal item named "to bananas"
  // instead of adding 2 bananas. Mapped here (not just in parseCommand)
  // so both quantity extraction and any future number-word use share it.
  to: 2,
  too: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  couple: 2,
  few: 3,
}
