import requests
import time
import logging
import os
from datetime import datetime, timedelta
from database import save_inspiration
from scoring import calculate_score

logger = logging.getLogger(__name__)

def scrape_behance():
    """Scrape trending projects from Behance"""
    try:
        # Use Behance API (requires API key)
        api_key = os.environ.get('BEHANCE_API_KEY')
        if not api_key:
            logger.warning("Behance API key not found, skipping...")
            return
        
        url = f"https://api.behance.net/v2/projects?api_key={api_key}&sort=appreciations&time=today&per_page=50"
        
        response = requests.get(url)
        response.raise_for_status()
        
        data = response.json()
        projects = data.get('projects', [])
        
        for project in projects:
            try:
                # Extract project data
                inspiration_data = {
                    'title': project.get('name', 'Untitled'),
                    'description': project.get('description', ''),
                    'contentUrl': project.get('url', ''),
                    'thumbnailUrl': project.get('covers', {}).get('original', ''),
                    'platform': 'Behance',
                    'authorName': project.get('owners', [{}])[0].get('display_name', ''),
                    'authorUrl': project.get('owners', [{}])[0].get('url', ''),
                    'tags': [field.get('name') for field in project.get('fields', [])],
                    'publishedAt': datetime.fromtimestamp(project.get('published_on', 0)) if project.get('published_on') else datetime.now(),
                    'sourceMeta': {
                        'likes': project.get('stats', {}).get('appreciations', 0),
                        'views': project.get('stats', {}).get('views', 0),
                        'comments': project.get('stats', {}).get('comments', 0),
                    }
                }
                
                # Calculate score
                inspiration_data['score'] = calculate_score(inspiration_data)
                
                # Save to database
                save_inspiration(inspiration_data)
                
                # Rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error processing Behance project: {e}")
        
        logger.info(f"Scraped {len(projects)} projects from Behance")
        
    except Exception as e:
        logger.error(f"Behance scraping failed: {e}")