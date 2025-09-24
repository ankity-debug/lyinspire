export interface Inspiration {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  contentUrl: string;
  platform: 'Behance' | 'Dribbble' | 'Medium' | 'Core77' | 'Awwwards';
  authorName?: string;
  authorUrl?: string;
  tags: string[];
  score: number;
  publishedAt: Date;
  scrapedAt: Date;
  curatedBy?: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  sourceMeta?: Record<string, any>;
}

export interface TodayData {
  awardPick: Inspiration;
  top10: Inspiration[];
}

export interface InspirationFilters {
  search?: string;
  platform?: string;
  tags?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface Submission {
  id: string;
  title: string;
  description?: string;
  contentUrl: string;
  submitterName: string;
  submitterEmail: string;
  platform: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}