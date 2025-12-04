import type { MDXComponents } from 'mdx/types'

// Generate ID from heading text
function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h2: ({ children, ...props }) => {
      const id = typeof children === 'string' ? generateId(children) : undefined
      return (
        <h2 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h2>
      )
    },
    h3: ({ children, ...props }) => {
      const id = typeof children === 'string' ? generateId(children) : undefined
      return (
        <h3 id={id} className="scroll-mt-24" {...props}>
          {children}
        </h3>
      )
    },
  }
}
