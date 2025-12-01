export type Article = {
  title: string;
  slug: string;
  thumbnail: string;
  category: string;
  categoryColor: string;
  excerpt: string;
  readTime: number;
  isNew?: boolean;
  isPopular?: boolean;
};

export type Section = {
  id: string;
  title: string;
  icon?: string;
  articles: Article[];
};

export type ArticleWithSection = Article & {
  sectionId: string;
  sectionTitle: string;
};
