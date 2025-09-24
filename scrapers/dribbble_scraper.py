import requests
import time
import logging
import os
from datetime import datetime
from database import save_inspiration
from scoring import calculate_score

logger = logging.getLogger(__name__)

def scrape_dribbble():
    """Scrape popular shots from Dribbble"""
    try:
        access_token = os.environ.get('DRIBBBLE_ACCESS_TOKEN')
        if not access_token:
            logger.warning("Dribbble access token not found, skipping...")
            return
        
        url = f"https://api.dribbble.com/v2/shots?access_token={access_token}&sort=popular&timeframe=day&per_page=50"
        
        response = requests.get(url)
        response.raise_for_status()
        
        shots = response.json()
        
        for shot in shots:
            try:
                inspiration_data = {
                    'title': shot.get('title', 'Untitled'),
                    'description': shot.get('description', ''),
                    'contentUrl': shot.get('html_url', ''),
                    'thumbnailUrl': shot.get('images', {}).get('normal', ''),
                    'platform': 'Dribbble',
                    'authorName': shot.get('user', {}).get('name', ''),
                    'authorUrl': shot.get('user', {}).get('html_url', ''),
                    'tags': shot.get('tags', []),
                    'publishedAt': datetime.fromisoformat(shot.get('published_at', '').replace('Z', '+00:00')) if shot.get('published_at') else datetime.now(),
                    'sourceMeta': {
                        'likes': shot.get('likes_count', 0),
                        'views': shot.get('views_count', 0),
                        'comments': shot.get('comments_count', 0),
                    }
                }
                
                inspiration_data['score'] = calculate_score(inspiration_data)
                save_inspiration(inspiration_data)
                
                time.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error processing Dribbble shot: {e}")
        
        logger.info(f"Scraped {len(shots)} shots from Dribbble")
        
    except Exception as e:
        logger.error(f"Dribbble scraping failed: {e}")