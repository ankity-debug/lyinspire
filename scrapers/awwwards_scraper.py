import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime
from database import save_inspiration
from scoring import calculate_score

logger = logging.getLogger(__name__)

def scrape_awwwards():
    """Scrape award-winning sites from Awwwards"""
    try:
        url = "https://www.awwwards.com/websites/"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        websites = soup.find_all('div', class_='item')[:15]
        
        for website in websites:
            try:
                title_elem = website.find('h3') or website.find('h2')
                title = title_elem.get_text().strip() if title_elem else 'Untitled Website'
                
                link_elem = website.find('a')
                link = f"https://www.awwwards.com{link_elem.get('href')}" if link_elem else ''
                
                # Try to get thumbnail
                img_elem = website.find('img')
                thumbnail = img_elem.get('src') if img_elem else ''
                if thumbnail and thumbnail.startswith('/'):
                    thumbnail = f"https://www.awwwards.com{thumbnail}"
                
                # Get agency/author info
                agency_elem = website.find('span', class_='agency') or website.find('div', class_='agency')
                agency = agency_elem.get_text().strip() if agency_elem else 'Unknown Agency'
                
                inspiration_data = {
                    'title': title,
                    'description': f"Award-winning website design by {agency}",
                    'contentUrl': link,
                    'thumbnailUrl': thumbnail,
                    'platform': 'Awwwards',
                    'authorName': agency,
                    'tags': ['Web Design', 'Award Winner', 'UI/UX'],
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
                logger.error(f"Error processing Awwwards website: {e}")
        
        logger.info(f"Scraped {len(websites)} websites from Awwwards")
        
    except Exception as e:
        logger.error(f"Awwwards scraping failed: {e}")