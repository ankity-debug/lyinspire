import schedule
import time
import logging
from datetime import datetime
from behance_scraper import scrape_behance
from dribbble_scraper import scrape_dribbble
from medium_scraper import scrape_medium
from core77_scraper import scrape_core77
from awwwards_scraper import scrape_awwwards
from curation import curate_daily_content
from database import setup_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_daily_scraping():
    """Run the daily scraping and curation process"""
    logger.info(f"Starting daily scraping process at {datetime.now()}")
    
    try:
        # Setup database connection
        setup_database()
        
        # Run scrapers
        scrapers = [
            ("Behance", scrape_behance),
            ("Dribbble", scrape_dribbble), 
            ("Medium", scrape_medium),
            ("Core77", scrape_core77),
            ("Awwwards", scrape_awwwards),
        ]
        
        for platform, scraper_func in scrapers:
            try:
                logger.info(f"Scraping {platform}...")
                scraper_func()
                logger.info(f"Successfully scraped {platform}")
            except Exception as e:
                logger.error(f"Failed to scrape {platform}: {e}")
        
        # Run curation
        logger.info("Running curation algorithm...")
        curate_daily_content()
        logger.info("Curation completed successfully")
        
    except Exception as e:
        logger.error(f"Daily scraping process failed: {e}")

def main():
    """Main scheduler function"""
    # Schedule daily scraping at 3:00 AM IST
    schedule.every().day.at("03:00").do(run_daily_scraping)
    
    logger.info("Scheduler started. Waiting for scheduled jobs...")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    main()