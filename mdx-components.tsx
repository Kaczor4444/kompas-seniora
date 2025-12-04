import type { MDXComponents } from 'mdx/types'

// Extract text from React children (handles strings and React elements)
function getTextFromChildren(children: any): string {
  if (typeof children === 'string') {
    return children
  }
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join('')
  }
  if (children?.props?.children) {
    return getTextFromChildren(children.props.children)
  }
  return ''
}

// Generate ID from heading text (normalize Polish characters to ASCII)
function generateId(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (ą→a, ę→e, etc)
    .replace(/ł/g, 'l') // Polish ł → l
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric
    .replace(/\s+/g, '-') // Spaces to dashes
    .replace(/-+/g, '-') // Remove duplicate dashes
    .trim()
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h2: ({ children, ...props }) => {
      const text = getTextFromChildren(children)
      const id = text ? generateId(text) : undefined
      if (id) console.log('🏷️ H2 rendered with ID:', id, '- Text:', text.slice(0, 60)) // DEBUG
      return (
        <h2 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h2>
      )
    },
    h3: ({ children, ...props }) => {
      const text = getTextFromChildren(children)
      const id = text ? generateId(text) : undefined
      if (id) console.log('🏷️ H3 rendered with ID:', id, '- Text:', text.slice(0, 60)) // DEBUG
      return (
        <h3 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h3>
      )
    },
  }
}
