import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime
from database import save_inspiration
from scoring import calculate_score

logger = logging.getLogger(__name__)

def scrape_medium():
    """Scrape design articles from Medium"""
    try:
        # Medium's design tag RSS feed
        url = "https://medium.com/feed/tag/design"
        
        response = requests.get(url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'xml')
        items = soup.find_all('item')[:20]  # Get latest 20 articles
        
        for item in items:
            try:
                title = item.find('title').text if item.find('title') else 'Untitled'
                description = item.find('description').text if item.find('description') else ''
                link = item.find('link').text if item.find('link') else ''
                pub_date = item.find('pubDate').text if item.find('pubDate') else ''
                
                # Parse publication date
                pub_datetime = datetime.strptime(pub_date, '%a, %d %b %Y %H:%M:%S %Z') if pub_date else datetime.now()
                
                # Extract author from description or use default
                author = "Medium Author"  # Could be extracted from description HTML
                
                inspiration_data = {
                    'title': title,
                    'description': description[:500] + '...' if len(description) > 500 else description,
                    'contentUrl': link,
                    'platform': 'Medium',
                    'authorName': author,
                    'tags': ['Design', 'Article'],
                    'publishedAt': pub_datetime,
                    'sourceMeta': {
                        'likes': 0,  # Not available via RSS
                        'views': 0,
                        'comments': 0,
                    }
                }
                
                inspiration_data['score'] = calculate_score(inspiration_data)
                save_inspiration(inspiration_data)
                
            except Exception as e:
                logger.error(f"Error processing Medium article: {e}")
        
        logger.info(f"Scraped {len(items)} articles from Medium")
        
    except Exception as e:
        logger.error(f"Medium scraping failed: {e}")