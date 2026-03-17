export type Article = {
  slug: string;
  sectionId: string;
  category: string;

  // Display settings for featured articles
  badge?: 'POLECAMY' | 'NOWE' | 'NOWY ARTYKUŁ' | 'WKRÓTCE';
  thumbnail?: string;  // Optional - overrides MDX frontmatter
  isActive?: boolean;  // Default: true (if false, shows as "WKRÓTCE")
  featuredOrder?: number;  // Order in home page carousel (lower = first)
};

export type Section = {
  id: string;
  title: string;
  icon?: string;
  articles: Article[];
};

export type ArticleWithSection = Article & {
  sectionTitle: string;
};
