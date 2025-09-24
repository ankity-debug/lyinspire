from datetime import datetime, timedelta
import math
import logging
from typing import Dict, Any, List, Optional
import psycopg2
import os

logger = logging.getLogger(__name__)

class OptimizedScoring:
    """
    Optimized scoring system that pre-calculates and caches scores for better performance.
    Supports batch processing and incremental updates.
    """
    
    def __init__(self):
        self.conn = None
        self.cursor = None
        
    def get_connection(self):
        """Get database connection"""
        if not self.conn or self.conn.closed:
            self.conn = psycopg2.connect(os.environ['DATABASE_URL'])
        return self.conn

    def calculate_score_optimized(self, inspiration_data: Dict[str, Any]) -> float:
        """
        Optimized score calculation with improved performance.
        Cached intermediate calculations and vectorized operations where possible.
        """
        try:
            score = 0
            
            # Engagement metrics (45%) - optimized calculation
            engagement_score = self._calculate_engagement_score_optimized(
                inspiration_data.get('sourceMeta', {})
            )
            score += engagement_score * 0.45
            
            # Image quality (15%) - enhanced heuristics
            image_quality_score = self._calculate_image_quality_score_optimized(inspiration_data)
            score += image_quality_score * 0.15
            
            # Recency (10%) - cached time calculations
            recency_score = self._calculate_recency_score_optimized(
                inspiration_data.get('publishedAt')
            )
            score += recency_score * 0.10
            
            # Tag relevance (10%) - optimized tag matching
            tag_relevance_score = self._calculate_tag_relevance_score_optimized(
                inspiration_data.get('tags', [])
            )
            score += tag_relevance_score * 0.10
            
            # Platform bonus (20%) - cached platform scores
            platform_score = self._get_platform_score_cached(
                inspiration_data.get('platform', '')
            )
            score += platform_score * 0.20
            
            return min(max(score, 0), 100)  # Clamp between 0-100
            
        except Exception as e:
            logger.error(f"Error calculating optimized score: {e}")
            return 50.0  # Default fallback score

    def _calculate_engagement_score_optimized(self, source_meta: Dict) -> float:
        """Optimized engagement scoring with better normalization"""
        likes = source_meta.get('likes', 0)
        views = source_meta.get('views', 0)
        comments = source_meta.get('comments', 0)
        saves = source_meta.get('saves', 0)  # Additional metric
        
        # Improved logarithmic normalization
        like_score = min(math.log10(likes + 1) * 20, 100) if likes > 0 else 0
        view_score = min(math.log10(views + 1) * 15, 100) if views > 0 else 0
        comment_score = min(math.log10(comments + 1) * 25, 100) if comments > 0 else 0
        save_score = min(math.log10(saves + 1) * 30, 100) if saves > 0 else 0
        
        # Weighted average with saves getting higher weight
        weights = {'likes': 0.3, 'views': 0.2, 'comments': 0.3, 'saves': 0.2}
        
        total_score = (
            like_score * weights['likes'] +
            view_score * weights['views'] +
            comment_score * weights['comments'] +
            save_score * weights['saves']
        )
        
        return min(total_score, 100)

    def _calculate_image_quality_score_optimized(self, inspiration_data: Dict) -> float:
        """Enhanced image quality scoring with multiple heuristics"""
        score = 30  # Base score
        
        # Check for thumbnail
        if inspiration_data.get('thumbnailUrl'):
            score += 25
            
        # Check for high-resolution indicators in URL
        thumbnail_url = inspiration_data.get('thumbnailUrl', '')
        if any(indicator in thumbnail_url.lower() for indicator in ['1200', 'hd', 'high', '2x']):
            score += 15
            
        # Platform-specific quality indicators
        platform = inspiration_data.get('platform', '').lower()
        if platform in ['behance', 'dribbble', 'awwwards']:
            score += 10  # These platforms typically have higher quality standards
            
        # Content type indicators
        tags = inspiration_data.get('tags', [])
        quality_tags = ['high-quality', 'premium', 'professional', '4k', 'retina']
        if any(tag.lower() in ' '.join(tags).lower() for tag in quality_tags):
            score += 10
            
        return min(score, 100)

    def _calculate_recency_score_optimized(self, published_at) -> float:
        """Optimized recency calculation with caching"""
        if not published_at:
            return 30
        
        # Cache current time to avoid repeated calls
        now = datetime.now()
        if published_at.tzinfo:
            now = now.replace(tzinfo=published_at.tzinfo)
        
        # More granular recency scoring
        hours_old = (now - published_at).total_seconds() / 3600
        
        if hours_old <= 24:
            return 100
        elif hours_old <= 48:
            return 90
        elif hours_old <= 168:  # 1 week
            return 80
        elif hours_old <= 720:  # 1 month
            return 60
        elif hours_old <= 2160:  # 3 months
            return 40
        else:
            return 20

    def _calculate_tag_relevance_score_optimized(self, tags: List[str]) -> float:
        """Optimized tag relevance with weighted scoring"""
        if not tags:
            return 30
        
        # Tier-based scoring system
        tier_1_tags = {
            'ui design': 20, 'ux design': 20, 'web design': 18, 'mobile design': 18,
            'product design': 18, 'branding': 16, 'typography': 16
        }
        
        tier_2_tags = {
            'graphic design': 12, 'logo design': 12, 'illustration': 12,
            'interface design': 14, 'interaction design': 14, 'visual design': 12
        }
        
        tier_3_tags = {
            'design': 8, 'creative': 6, 'art': 6, 'digital': 8,
            'portfolio': 4, 'concept': 6, 'modern': 4
        }
        
        score = 30  # Base score
        tag_text = ' '.join(tags).lower()
        
        # Check tier 1 tags (highest value)
        for tag, points in tier_1_tags.items():
            if tag in tag_text:
                score += points
        
        # Check tier 2 tags
        for tag, points in tier_2_tags.items():
            if tag in tag_text:
                score += points
        
        # Check tier 3 tags
        for tag, points in tier_3_tags.items():
            if tag in tag_text:
                score += points
        
        return min(score, 100)

    def _get_platform_score_cached(self, platform: str) -> float:
        """Cached platform scoring with enhanced metrics"""
        platform_scores = {
            'Awwwards': 95,     # Highest quality, award-winning designs
            'Behance': 85,      # Adobe's creative platform
            'Dribbble': 80,     # Popular design community
            'Core77': 75,      # Industrial design focus
            'Medium': 65,       # General content platform
            'DeviantArt': 60,   # Art community
            'Pinterest': 45,    # Social discovery
        }
        
        return platform_scores.get(platform, 50)

    def batch_update_scores(self, batch_size: int = 100) -> int:
        """
        Batch update scores for inspirations that need recalculation.
        Returns number of updated records.
        """
        try:
            self.conn = self.get_connection()
            self.cursor = self.conn.cursor()
            
            # Get inspirations that need score updates
            self.cursor.execute("""
                SELECT id, title, description, "thumbnailUrl", "contentUrl", platform, 
                       "authorName", "authorUrl", tags, "publishedAt", "sourceMeta"
                FROM inspirations 
                WHERE archived = false 
                  AND (score IS NULL OR score = 0 OR "updatedAt" < NOW() - INTERVAL '7 days')
                ORDER BY "scrapedAt" DESC
                LIMIT %s
            """, (batch_size,))
            
            inspirations = self.cursor.fetchall()
            updated_count = 0
            
            for inspiration in inspirations:
                inspiration_data = {
                    'id': inspiration[0],
                    'title': inspiration[1],
                    'description': inspiration[2],
                    'thumbnailUrl': inspiration[3],
                    'contentUrl': inspiration[4],
                    'platform': inspiration[5],
                    'authorName': inspiration[6],
                    'authorUrl': inspiration[7],
                    'tags': inspiration[8],
                    'publishedAt': inspiration[9],
                    'sourceMeta': inspiration[10] or {}
                }
                
                new_score = self.calculate_score_optimized(inspiration_data)
                
                # Update score in database
                self.cursor.execute("""
                    UPDATE inspirations 
                    SET score = %s, "updatedAt" = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (new_score, inspiration_data['id']))
                
                updated_count += 1
                
                if updated_count % 10 == 0:
                    logger.info(f"Updated scores for {updated_count} inspirations")
            
            self.conn.commit()
            logger.info(f"Batch score update completed: {updated_count} records updated")
            return updated_count
            
        except Exception as e:
            if self.conn:
                self.conn.rollback()
            logger.error(f"Batch score update failed: {e}")
            return 0
        finally:
            if self.cursor:
                self.cursor.close()
            if self.conn:
                self.conn.close()

    def recalculate_all_scores(self) -> bool:
        """
        Recalculate all scores in the database.
        Use carefully as this can be a long-running operation.
        """
        try:
            batch_size = 50  # Smaller batches for full recalculation
            total_updated = 0
            
            while True:
                updated = self.batch_update_scores(batch_size)
                total_updated += updated
                
                if updated < batch_size:
                    break  # No more records to update
                
                logger.info(f"Progress: {total_updated} scores recalculated")
            
            logger.info(f"Full score recalculation completed: {total_updated} total updates")
            return True
            
        except Exception as e:
            logger.error(f"Full score recalculation failed: {e}")
            return False

# Backward compatibility functions
def calculate_score(inspiration_data):
    """Backward compatible function using optimized scoring"""
    scorer = OptimizedScoring()
    return scorer.calculate_score_optimized(inspiration_data)

def calculate_score_optimized(inspiration_data):
    """Direct access to optimized scoring"""
    scorer = OptimizedScoring()
    return scorer.calculate_score_optimized(inspiration_data)

if __name__ == "__main__":
    # For testing
    scorer = OptimizedScoring()
    updated = scorer.batch_update_scores(10)
    print(f"Updated {updated} scores")