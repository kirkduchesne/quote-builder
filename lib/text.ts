// Keep complete code points without exceeding a UTF-16 field limit.
export function truncateText(value: string, maxUnits: number): string {
  let result = '';
  for (const character of value) {
    if (result.length + character.length > maxUnits) break;
    result += character;
  }
  return result;
}
