import psycopg2
import os
import logging
from datetime import datetime, date

logger = logging.getLogger(__name__)

def curate_daily_content():
    """Curate today's award pick and top 10 inspirations"""
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor()
        
        today = date.today()
        
        # Get top inspirations with diversity constraints
        cursor.execute("""
            WITH platform_limited AS (
                SELECT *, 
                       ROW_NUMBER() OVER (PARTITION BY platform ORDER BY score DESC) as platform_rank
                FROM inspirations 
                WHERE archived = false
            ),
            author_limited AS (
                SELECT *,
                       ROW_NUMBER() OVER (PARTITION BY "authorName" ORDER BY score DESC) as author_rank
                FROM platform_limited
                WHERE platform_rank <= 4  -- Max 4 per platform
            )
            SELECT id, title, score, platform, "authorName"
            FROM author_limited 
            WHERE author_rank <= 2  -- Max 2 per author
            ORDER BY score DESC
            LIMIT 11
        """)
        
        top_inspirations = cursor.fetchall()
        
        if not top_inspirations:
            logger.warning("No inspirations found for curation")
            return
        
        # First one is award pick, rest are top 10
        award_pick_id = top_inspirations[0][0]
        top_10_ids = [row[0] for row in top_inspirations[1:11]]
        
        # Save or update daily curation
        cursor.execute("""
            INSERT INTO daily_curations (date, "awardPickId", "top10Ids")
            VALUES (%s, %s, %s)
            ON CONFLICT (date) 
            DO UPDATE SET 
                "awardPickId" = EXCLUDED."awardPickId",
                "top10Ids" = EXCLUDED."top10Ids",
                "updatedAt" = CURRENT_TIMESTAMP
        """, (today, award_pick_id, top_10_ids))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Curated daily content: Award Pick ID {award_pick_id}, Top 10 count: {len(top_10_ids)}")
        
    except Exception as e:
        logger.error(f"Curation failed: {e}")