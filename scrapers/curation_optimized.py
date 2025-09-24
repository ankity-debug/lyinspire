import psycopg2
import os
import logging
from datetime import datetime, date, timedelta
from typing import List, Tuple, Dict, Optional
import json

logger = logging.getLogger(__name__)

class OptimizedCurator:
    """Optimized curation system for better performance with large datasets"""
    
    def __init__(self):
        self.conn = None
        self.cursor = None
        
    def get_connection(self):
        """Get database connection with connection pooling support"""
        if not self.conn or self.conn.closed:
            self.conn = psycopg2.connect(os.environ['DATABASE_URL'])
        return self.conn
    
    def curate_daily_content_optimized(self, target_date: Optional[date] = None) -> bool:
        """
        Optimized daily curation algorithm that scales with large datasets.
        Uses indexes effectively and implements efficient diversity constraints.
        """
        target_date = target_date or date.today()
        
        try:
            self.conn = self.get_connection()
            self.cursor = self.conn.cursor()
            
            logger.info(f"Starting optimized curation for {target_date}")
            
            # Step 1: Get diverse high-scoring content using optimized query
            diverse_content = self._get_diverse_high_scoring_content()
            
            if not diverse_content:
                logger.warning("No suitable content found for curation")
                return False
            
            # Step 2: Select award pick and top 10 with final scoring adjustments
            award_pick_id, top_10_ids = self._select_final_curation(diverse_content)
            
            # Step 3: Save curation results
            self._save_curation_results(target_date, award_pick_id, top_10_ids)
            
            self.conn.commit()
            logger.info(f"Successfully curated content: Award Pick {award_pick_id}, Top 10: {len(top_10_ids)}")
            
            return True
            
        except Exception as e:
            if self.conn:
                self.conn.rollback()
            logger.error(f"Optimized curation failed: {e}")
            return False
        finally:
            if self.cursor:
                self.cursor.close()
            if self.conn:
                self.conn.close()
    
    def _get_diverse_high_scoring_content(self) -> List[Tuple]:
        """
        Get diverse high-scoring content using optimized query with proper indexes.
        This replaces the expensive window function approach.
        """
        # Use the indexes we created for optimal performance
        query = """
            WITH high_quality_base AS (
                -- Use partial index for non-archived content with high scores
                SELECT id, title, score, platform, "authorName", "publishedAt", tags
                FROM inspirations 
                WHERE archived = false 
                  AND score >= 60  -- Only consider high-quality content
                ORDER BY score DESC
                LIMIT 500  -- Reasonable working set size
            ),
            platform_ranked AS (
                -- Get top content per platform efficiently
                SELECT DISTINCT ON (platform) 
                    id, score, platform, "authorName", "publishedAt"
                FROM high_quality_base
                ORDER BY platform, score DESC
            ),
            platform_diverse AS (
                -- Get additional content from each platform for diversity
                SELECT h.id, h.score, h.platform, h."authorName", h."publishedAt"
                FROM high_quality_base h
                WHERE h.id IN (
                    SELECT id FROM (
                        SELECT id, ROW_NUMBER() OVER (PARTITION BY platform ORDER BY score DESC) as rn
                        FROM high_quality_base
                    ) ranked WHERE rn <= 5  -- Top 5 per platform
                )
            ),
            author_diverse AS (
                -- Ensure author diversity (max 2 per author)
                SELECT id, score, platform, "authorName", "publishedAt"
                FROM platform_diverse
                WHERE "authorName" IS NULL 
                   OR id IN (
                    SELECT id FROM (
                        SELECT id, ROW_NUMBER() OVER (PARTITION BY "authorName" ORDER BY score DESC) as rn
                        FROM platform_diverse
                        WHERE "authorName" IS NOT NULL
                    ) ranked WHERE rn <= 2
                )
            )
            SELECT id, score, platform, "authorName", "publishedAt"
            FROM author_diverse
            ORDER BY score DESC
            LIMIT 50;  -- Working set for final selection
        """
        
        self.cursor.execute(query)
        return self.cursor.fetchall()
    
    def _select_final_curation(self, candidates: List[Tuple]) -> Tuple[str, List[str]]:
        """
        Apply final scoring adjustments and select award pick + top 10.
        Considers recency, platform balance, and quality.
        """
        if not candidates:
            raise ValueError("No candidates provided for final selection")
        
        # Score adjustments for final selection
        scored_candidates = []
        platform_counts = {}
        
        for idx, (content_id, base_score, platform, author_name, published_at) in enumerate(candidates):
            # Apply recency boost
            recency_boost = self._calculate_recency_boost(published_at)
            
            # Apply platform diversity penalty if too many from same platform
            platform_count = platform_counts.get(platform, 0)
            platform_penalty = min(platform_count * 5, 20)  # Max 20 point penalty
            
            # Apply position penalty for lower ranked items
            position_penalty = idx * 0.5  # Small penalty for lower positions
            
            final_score = base_score + recency_boost - platform_penalty - position_penalty
            
            scored_candidates.append((content_id, final_score, platform))
            platform_counts[platform] = platform_count + 1
        
        # Sort by final score and select winners
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        
        award_pick_id = scored_candidates[0][0]
        top_10_ids = [item[0] for item in scored_candidates[1:11]]
        
        return award_pick_id, top_10_ids
    
    def _calculate_recency_boost(self, published_at) -> float:
        """Calculate recency boost for final scoring"""
        if not published_at:
            return 0
        
        now = datetime.now()
        if published_at.tzinfo:
            now = now.replace(tzinfo=published_at.tzinfo)
        
        days_old = (now - published_at).days
        
        if days_old <= 1:
            return 5.0
        elif days_old <= 7:
            return 3.0
        elif days_old <= 30:
            return 1.0
        else:
            return 0
    
    def _save_curation_results(self, target_date: date, award_pick_id: str, top_10_ids: List[str]):
        """Save curation results with optimized upsert"""
        self.cursor.execute("""
            INSERT INTO daily_curations (id, date, "awardPickId", "top10Ids", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (date) 
            DO UPDATE SET 
                "awardPickId" = EXCLUDED."awardPickId",
                "top10Ids" = EXCLUDED."top10Ids",
                "updatedAt" = CURRENT_TIMESTAMP
        """, (target_date, award_pick_id, top_10_ids))
    
    def get_curation_stats(self) -> Dict:
        """Get curation statistics for monitoring"""
        try:
            self.conn = self.get_connection()
            self.cursor = self.conn.cursor()
            
            # Get basic stats
            self.cursor.execute("""
                SELECT 
                    COUNT(*) as total_inspirations,
                    COUNT(*) FILTER (WHERE archived = false) as active_inspirations,
                    AVG(score) as avg_score,
                    COUNT(DISTINCT platform) as platforms,
                    COUNT(DISTINCT "authorName") as authors
                FROM inspirations
            """)
            
            stats = dict(zip([
                'total_inspirations', 'active_inspirations', 
                'avg_score', 'platforms', 'authors'
            ], self.cursor.fetchone()))
            
            # Get recent curation info
            self.cursor.execute("""
                SELECT date, "awardPickId", array_length("top10Ids", 1) as top10_count
                FROM daily_curations 
                ORDER BY date DESC 
                LIMIT 7
            """)
            
            recent_curations = self.cursor.fetchall()
            stats['recent_curations'] = [
                {
                    'date': str(row[0]),
                    'award_pick_id': row[1],
                    'top10_count': row[2] or 0
                }
                for row in recent_curations
            ]
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get curation stats: {e}")
            return {}
        finally:
            if self.cursor:
                self.cursor.close()
            if self.conn:
                self.conn.close()

# Convenience functions for backward compatibility
def curate_daily_content():
    """Backward compatible function using optimized curator"""
    curator = OptimizedCurator()
    return curator.curate_daily_content_optimized()

def curate_daily_content_optimized():
    """Direct access to optimized curation"""
    curator = OptimizedCurator()
    return curator.curate_daily_content_optimized()

if __name__ == "__main__":
    # For testing
    curator = OptimizedCurator()
    stats = curator.get_curation_stats()
    print("Curation Stats:", json.dumps(stats, indent=2))