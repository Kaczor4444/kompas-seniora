export interface Heading {
  id: string
  text: string
  level: number
}

/**
 * Extract headings (H2, H3) from MDX content
 * Generates IDs from heading text for anchor links
 */
export function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: Heading[] = []

  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length // ## = 2, ### = 3
    const text = match[2].trim()

    // Generate ID from text (lowercase, replace spaces with dashes)
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Remove duplicate dashes

    headings.push({ id, text, level })
  }

  return headings
}
