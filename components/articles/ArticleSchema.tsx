interface ArticleSchemaProps {
  title: string
  excerpt: string
  publishedAt: string
  updatedAt?: string
  category: string
}

export default function ArticleSchema({
  title,
  excerpt,
  publishedAt,
  updatedAt,
  category,
}: ArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: excerpt,
    author: {
      '@type': 'Organization',
      name: 'Kompas Seniora',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kompas Seniora',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kompas-seniora.vercel.app/logo.png',
      },
    },
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    keywords: category,
    inLanguage: 'pl-PL',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
