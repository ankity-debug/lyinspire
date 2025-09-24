import psycopg2
import os
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def setup_database():
    """Setup database tables if they don't exist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if tables exist (they should be created by Prisma)
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'inspirations'
            );
        """)
        
        if cursor.fetchone()[0]:
            logger.info("Database tables already exist")
        else:
            logger.warning("Database tables don't exist. Run Prisma migrations first.")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"Database setup error: {e}")

def save_inspiration(inspiration_data):
    """Save inspiration to database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if already exists
        cursor.execute(
            "SELECT id FROM inspirations WHERE \"contentUrl\" = %s",
            (inspiration_data['contentUrl'],)
        )
        
        if cursor.fetchone():
            logger.info(f"Inspiration already exists: {inspiration_data['title']}")
            cursor.close()
            conn.close()
            return None
        
        # Insert new inspiration
        cursor.execute("""
            INSERT INTO inspirations (
                id, title, description, "thumbnailUrl", "contentUrl", 
                platform, "authorName", "authorUrl", tags, score, 
                "publishedAt", "scrapedAt", "sourceMeta"
            ) VALUES (
                gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id
        """, (
            inspiration_data['title'],
            inspiration_data.get('description'),
            inspiration_data.get('thumbnailUrl'),
            inspiration_data['contentUrl'],
            inspiration_data['platform'],
            inspiration_data.get('authorName'),
            inspiration_data.get('authorUrl'),
            inspiration_data.get('tags', []),
            inspiration_data.get('score', 50),
            inspiration_data.get('publishedAt', datetime.now()),
            datetime.now(),
            json.dumps(inspiration_data.get('sourceMeta', {}))
        ))
        
        inspiration_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Saved inspiration: {inspiration_data['title']}")
        return inspiration_id
        
    except Exception as e:
        logger.error(f"Failed to save inspiration: {e}")
        return None