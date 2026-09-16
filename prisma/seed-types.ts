/** Seed catalog types — shared by the product seed chunks. */

export type SeedLesson = {
  title: string;
  content: string;
  exercise: string;
  durationMin?: number;
  preview?: boolean;
};

export type SeedModule = {
  title: string;
  summary: string;
  lessons: SeedLesson[];
};

export type SeedProduct = {
  title: string;
  short: string;
  description: string;
  type: "COURSE" | "EBOOK" | "PDF" | "INTERACTIVE_WEB" | "RESOURCE_KIT";
  category: string;
  price: number;
  emoji: string;
  gradient: string;
  includes: string[];
  tags: string[];
  creatorIndex: number;
  modules: SeedModule[];
};