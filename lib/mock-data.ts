import { Inspiration, TodayData } from '@/types/inspiration';

const platforms = ['Behance', 'Dribbble', 'Medium', 'Core77', 'Awwwards'] as const;
const tags = [
  'UI Design', 'Web Design', 'Mobile App', 'Branding', 'Typography', 
  'Illustration', 'Photography', 'Product Design', 'UX Research', 'Animation',
  'Logo Design', 'Print Design', 'Packaging', 'Interior Design', 'Architecture'
];

const sampleTitles = [
  "Minimalist Banking App Interface",
  "Sustainable Fashion Brand Identity",
  "Interactive Data Visualization",
  "Modern E-commerce Experience",
  "Creative Portfolio Website",
  "Mobile Fitness App Design",
  "Contemporary Art Gallery",
  "Tech Startup Landing Page",
  "Food Delivery App Interface",
  "Corporate Rebranding Project",
  "Digital Magazine Layout",
  "Social Media App Concept",
  "Smart Home Dashboard",
  "Travel Booking Platform",
  "Educational Platform Design"
];

function generateMockInspiration(id: string, index: number): Inspiration {
  const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
  const randomTags = tags
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 4) + 2);
  
  const publishedDate = new Date();
  publishedDate.setDate(publishedDate.getDate() - Math.floor(Math.random() * 30));
  
  return {
    id,
    title: sampleTitles[index % sampleTitles.length],
    description: `A stunning example of modern ${randomTags[0].toLowerCase()} that showcases innovative approaches to user experience and visual design. This project demonstrates exceptional attention to detail and creative problem-solving.`,
    thumbnailUrl: `https://images.pexels.com/photos/${1000000 + index * 13}/pexels-photo-${1000000 + index * 13}.jpeg?auto=compress&cs=tinysrgb&w=600&h=400`,
    contentUrl: `https://example.com/inspiration/${id}`,
    platform: randomPlatform,
    authorName: `Designer ${String.fromCharCode(65 + (index % 26))}`,
    authorUrl: `https://example.com/profile/${id}`,
    tags: randomTags,
    score: Math.random() * 100 + 50,
    publishedAt: publishedDate,
    scrapedAt: new Date(),
    curatedBy: Math.random() > 0.7 ? 'admin' : undefined,
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    sourceMeta: {
      likes: Math.floor(Math.random() * 1000) + 100,
      views: Math.floor(Math.random() * 10000) + 1000,
      comments: Math.floor(Math.random() * 50) + 5
    }
  };
}

export const mockInspirations: Inspiration[] = Array.from({ length: 50 }, (_, i) => 
  generateMockInspiration(`inspiration-${i + 1}`, i)
);

export function getTodayData(): TodayData {
  const sortedByScore = [...mockInspirations].sort((a, b) => b.score - a.score);
  
  return {
    awardPick: sortedByScore[0],
    top10: sortedByScore.slice(1, 11)
  };
}

export function getInspirationById(id: string): Inspiration | null {
  return mockInspirations.find(inspiration => inspiration.id === id) || null;
}

export function getFilteredInspirations(filters: {
  search?: string;
  platform?: string;
  tags?: string;
  page?: number;
  limit?: number;
}) {
  let filtered = [...mockInspirations];
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  if (filters.platform) {
    filtered = filtered.filter(item => item.platform === filters.platform);
  }
  
  if (filters.tags) {
    const tagList = filters.tags.split(',').map(tag => tag.trim().toLowerCase());
    filtered = filtered.filter(item => 
      tagList.some(tag => 
        item.tags.some(itemTag => itemTag.toLowerCase().includes(tag))
      )
    );
  }
  
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const startIndex = (page - 1) * limit;
  const paginatedData = filtered.slice(startIndex, startIndex + limit);
  
  return {
    data: paginatedData,
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit),
    hasMore: startIndex + limit < filtered.length
  };
}

export function getRelatedInspirations(id: string, limit = 6): Inspiration[] {
  const current = getInspirationById(id);
  if (!current) return [];
  
  const related = mockInspirations
    .filter(item => item.id !== id)
    .filter(item => 
      item.platform === current.platform ||
      item.tags.some(tag => current.tags.includes(tag))
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
    
  return related;
}