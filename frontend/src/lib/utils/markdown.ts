/**
 * Utility functions for handling markdown content
 */

/**
 * Strip YAML frontmatter from markdown content
 * Frontmatter is content between --- markers at the start of the file
 *
 * @param markdown - The markdown content with potential frontmatter
 * @returns The markdown content without frontmatter
 *
 * @example
 * const markdown = `---
 * title: My Title
 * date: 2024-01-01
 * ---
 *
 * # Content`;
 *
 * stripFrontmatter(markdown); // Returns "# Content"
 */
export function stripFrontmatter(markdown: string): string {
  // Frontmatter regex: starts with ---, followed by any content, ends with ---
  // The s flag allows . to match newlines
  const frontmatterRegex = /^---\s*\n.*?\n---\s*\n/s;

  // Remove the frontmatter and return the rest
  return markdown.replace(frontmatterRegex, '');
}

/**
 * Extract YAML frontmatter from markdown content
 *
 * @param markdown - The markdown content with potential frontmatter
 * @returns The frontmatter string (without --- markers) or null if not found
 *
 * @example
 * const markdown = `---
 * title: My Title
 * date: 2024-01-01
 * ---
 *
 * # Content`;
 *
 * extractFrontmatter(markdown); // Returns "title: My Title\ndate: 2024-01-01"
 */
export function extractFrontmatter(markdown: string): string | null {
  const frontmatterRegex = /^---\s*\n(.*?)\n---\s*\n/s;
  const match = markdown.match(frontmatterRegex);

  return match ? match[1] : null;
}

/**
 * Check if markdown content has frontmatter
 *
 * @param markdown - The markdown content to check
 * @returns True if frontmatter exists, false otherwise
 */
export function hasFrontmatter(markdown: string): boolean {
  return /^---\s*\n.*?\n---\s*\n/s.test(markdown);
}
