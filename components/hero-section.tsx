import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-100 dark:from-yellow-950/20 dark:via-yellow-900/20 dark:to-orange-900/20 p-8 md:p-12">
      <div className="relative z-10 max-w-3xl">
        <Badge variant="outline" className="mb-4 bg-white/50 dark:bg-black/20">
          <Sparkles className="w-3 h-3 mr-1" />
          Daily Curated
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
          Discover Amazing
          <br />
          Design Inspiration
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
          Every day we curate the best design work from Behance, Dribbble, and other top platforms. 
          Get inspired by award-winning creativity and cutting-edge design trends.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-white">
            <Link href="/archive">
              Explore Archive
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg">
            <Link href="/submit">Submit Your Work</Link>
          </Button>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
        <div className="absolute top-8 right-8 w-32 h-32 bg-yellow-400 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-24 right-24 w-24 h-24 bg-orange-400 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}