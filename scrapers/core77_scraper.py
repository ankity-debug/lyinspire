import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime
from database import save_inspiration
from scoring import calculate_score

logger = logging.getLogger(__name__)

def scrape_core77():
    """Scrape design articles from Core77"""
    try:
        url = "https://www.core77.com/posts"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        articles = soup.find_all('article', class_='post-item')[:15]
        
        for article in articles:
            try:
                title_elem = article.find('h2') or article.find('h3')
                title = title_elem.get_text().strip() if title_elem else 'Untitled'
                
                link_elem = title_elem.find('a') if title_elem else None
                link = f"https://www.core77.com{link_elem.get('href')}" if link_elem else ''
                
                description_elem = article.find('p', class_='excerpt') or article.find('div', class_='excerpt')
                description = description_elem.get_text().strip() if description_elem else ''
                
                # Try to find author
                author_elem = article.find('span', class_='author') or article.find('a', class_='author')
                author = author_elem.get_text().strip() if author_elem else 'Core77'
                
                inspiration_data = {
                    'title': title,
                    'description': description,
                    'contentUrl': link,
                    'platform': 'Core77',
                    'authorName': author,
                    'tags': ['Product Design', 'Industrial Design'],
                    'publishedAt': datetime.now(),
                    'sourceMeta': {
                        'likes': 0,
                        'views': 0,
                        'comments': 0,
                    }
                }
                
                inspiration_data['score'] = calculate_score(inspiration_data)
                save_inspiration(inspiration_data)
                
            except Exception as e:
                logger.error(f"Error processing Core77 article: {e}")
        
        logger.info(f"Scraped {len(articles)} articles from Core77")
        
    except Exception as e:
        logger.error(f"Core77 scraping failed: {e}")