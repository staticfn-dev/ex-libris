
export interface Paper {
  id: string;
  url: string;
  title: string;
  summary: string;
  authors: string[];
  topic: string; // The main field (e.g., Neuroscience)
  subTopic?: string; // Specific sub-field
  tags: string[]; // Other keywords
  journal?: string;
  publishDate?: string;
  addedAt: number;
}

export interface PaperMetadata {
  title: string;
  summary: string;
  authors: string[];
  topic: string;
  subTopic?: string;
  tags: string[];
  journal?: string;
  publishDate?: string;
}
