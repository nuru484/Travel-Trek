// utils/truncateText.ts

/**
 * Truncates text to a specified maximum length and adds ellipsis if needed
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the text (default: 20)
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 20): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
};

// Usage example:
// const truncatedName = truncateText(destination.name);
// const truncatedName = truncateText(destination.name, 15); // Custom length
