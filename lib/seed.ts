import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

async function seed() {
  console.log('Starting database seed...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lyinspire.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword(adminPassword);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        name: 'Admin User',
      },
    });

    console.log(`Created admin user: ${adminEmail}`);
  }

  // Create sample inspirations
  const sampleInspirations = [
    {
      title: 'Minimalist Banking App Interface',
      description: 'A clean and modern interface design for a digital banking application featuring intuitive navigation and seamless user experience.',
      contentUrl: 'https://example.com/banking-app',
      thumbnailUrl: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg',
      platform: 'Behance',
      authorName: 'Alex Designer',
      authorUrl: 'https://example.com/alex',
      tags: ['UI Design', 'Mobile App', 'Banking', 'Fintech'],
      score: 92.5,
      publishedAt: new Date('2024-01-15'),
      sourceMeta: {
        likes: 1250,
        views: 8900,
        comments: 47,
      },
    },
    {
      title: 'Sustainable Fashion Brand Identity',
      description: 'Complete brand identity design for an eco-friendly fashion startup, including logo, typography, and packaging design.',
      contentUrl: 'https://example.com/fashion-brand',
      thumbnailUrl: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg',
      platform: 'Dribbble',
      authorName: 'Maria Creative',
      authorUrl: 'https://example.com/maria',
      tags: ['Branding', 'Fashion', 'Sustainability', 'Logo Design'],
      score: 88.2,
      publishedAt: new Date('2024-01-14'),
      sourceMeta: {
        likes: 890,
        views: 5600,
        comments: 32,
      },
    },
    {
      title: 'Interactive Data Visualization Dashboard',
      description: 'An innovative approach to data visualization featuring interactive charts and real-time analytics for enterprise users.',
      contentUrl: 'https://example.com/data-viz',
      thumbnailUrl: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
      platform: 'Awwwards',
      authorName: 'Data Studio',
      authorUrl: 'https://example.com/datastudio',
      tags: ['Data Visualization', 'Dashboard', 'Analytics', 'Web Design'],
      score: 95.1,
      publishedAt: new Date('2024-01-13'),
      sourceMeta: {
        likes: 2100,
        views: 12400,
        comments: 78,
      },
    },
  ];

  for (const inspiration of sampleInspirations) {
    const existing = await prisma.inspiration.findUnique({
      where: { contentUrl: inspiration.contentUrl },
    });

    if (!existing) {
      await prisma.inspiration.create({
        data: inspiration,
      });
      console.log(`Created inspiration: ${inspiration.title}`);
    }
  }

  console.log('Database seed completed!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });