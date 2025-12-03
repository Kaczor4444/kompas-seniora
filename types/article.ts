export type Article = {
  slug: string;
  sectionId: string;
  category: string;
  featured?: boolean;
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
