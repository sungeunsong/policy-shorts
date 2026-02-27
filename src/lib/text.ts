export function normalizeText(input: string): string {
  return input
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\t\n\r]+/g, " ")
    .replace(/[\s]+/g, " ")
    .trim();
}

export function simplifyForMatch(input: string): string {
  return normalizeText(input).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
}
