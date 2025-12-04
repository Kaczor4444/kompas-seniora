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

    // Generate ID from text (normalize Polish characters to ASCII)
    const id = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (ą→a, ę→e, etc)
      .replace(/ł/g, 'l') // Polish ł → l
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric
      .replace(/\s+/g, '-') // Spaces to dashes
      .replace(/-+/g, '-') // Remove duplicate dashes
      .trim()

    headings.push({ id, text, level })
    console.log('📝 Extracted heading:', { id, text, level }) // DEBUG
  }

  console.log('✅ Total headings extracted:', headings.length) // DEBUG
  return headings
}
