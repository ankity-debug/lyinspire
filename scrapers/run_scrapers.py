#!/usr/bin/env python3
"""
Main script to run all design inspiration scrapers
"""
import os
import sys
import logging
import argparse
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import scrapers
from behance_scraper import scrape_behance
from dribbble_scraper import scrape_dribbble
from medium_scraper import scrape_medium
from core77_scraper import scrape_core77
from awwwards_scraper import scrape_awwwards
from curation import curate_daily_content
from database import setup_database

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def run_all_scrapers():
    """Run all scrapers sequentially with error handling"""
    logger.info(f"Starting scraping process at {datetime.now()}")
    
    # Scrapers configuration
    scrapers = [
        ("Medium", scrape_medium, "No API key required - using RSS feed"),
        ("Core77", scrape_core77, "No API key required - web scraping"),
        ("Awwwards", scrape_awwwards, "No API key required - web scraping"),
        ("Behance", scrape_behance, "Requires BEHANCE_API_KEY environment variable"),
        ("Dribbble", scrape_dribbble, "Requires DRIBBBLE_ACCESS_TOKEN environment variable"),
    ]
    
    results = {}
    
    for platform, scraper_func, requirements in scrapers:
        try:
            logger.info(f"Starting {platform} scraper...")
            logger.info(f"Requirements: {requirements}")
            
            scraper_func()
            
            results[platform] = "Success"
            logger.info(f"✓ {platform} scraper completed successfully")
            
        except Exception as e:
            results[platform] = f"Failed: {str(e)}"
            logger.error(f"✗ {platform} scraper failed: {e}")
            
        # Small delay between scrapers
        import time
        time.sleep(2)
    
    return results

def run_curation():
    """Run the curation algorithm"""
    try:
        logger.info("Starting curation process...")
        curate_daily_content()
        logger.info("✓ Curation completed successfully")
        return True
    except Exception as e:
        logger.error(f"✗ Curation failed: {e}")
        return False

def check_environment():
    """Check if required environment variables are set"""
    logger.info("Checking environment configuration...")
    
    required_vars = ["DATABASE_URL"]
    optional_vars = ["BEHANCE_API_KEY", "DRIBBBLE_ACCESS_TOKEN"]
    
    missing_required = []
    missing_optional = []
    
    for var in required_vars:
        if not os.environ.get(var):
            missing_required.append(var)
        else:
            logger.info(f"✓ {var} is set")
    
    for var in optional_vars:
        if not os.environ.get(var):
            missing_optional.append(var)
        else:
            logger.info(f"✓ {var} is set")
    
    if missing_required:
        logger.error(f"Missing required environment variables: {missing_required}")
        return False
    
    if missing_optional:
        logger.warning(f"Missing optional environment variables: {missing_optional}")
        logger.warning("Some scrapers may be skipped")
    
    return True

def main():
    parser = argparse.ArgumentParser(description='Run design inspiration scrapers')
    parser.add_argument('--scrapers-only', action='store_true', help='Run only scrapers, skip curation')
    parser.add_argument('--curation-only', action='store_true', help='Run only curation, skip scrapers')
    parser.add_argument('--platform', choices=['behance', 'dribbble', 'medium', 'core77', 'awwwards'], 
                        help='Run only specific platform scraper')
    
    args = parser.parse_args()
    
    logger.info("=== Design Inspiration Scraper Starting ===")
    
    # Check environment
    if not check_environment():
        logger.error("Environment check failed. Exiting.")
        sys.exit(1)
    
    # Setup database
    try:
        logger.info("Setting up database connection...")
        setup_database()
        logger.info("✓ Database setup completed")
    except Exception as e:
        logger.error(f"✗ Database setup failed: {e}")
        sys.exit(1)
    
    success = True
    
    # Run specific platform if requested
    if args.platform:
        scraper_map = {
            'behance': scrape_behance,
            'dribbble': scrape_dribbble,
            'medium': scrape_medium,
            'core77': scrape_core77,
            'awwwards': scrape_awwwards
        }
        
        try:
            logger.info(f"Running {args.platform} scraper only...")
            scraper_map[args.platform]()
            logger.info(f"✓ {args.platform} scraper completed")
        except Exception as e:
            logger.error(f"✗ {args.platform} scraper failed: {e}")
            success = False
    
    # Run scrapers unless curation-only is specified
    elif not args.curation_only:
        results = run_all_scrapers()
        
        # Print summary
        logger.info("\n=== Scraping Results Summary ===")
        for platform, result in results.items():
            status = "✓" if result == "Success" else "✗"
            logger.info(f"{status} {platform}: {result}")
        
        # Check if any scrapers failed
        failed_scrapers = [p for p, r in results.items() if r != "Success"]
        if failed_scrapers:
            logger.warning(f"Some scrapers failed: {failed_scrapers}")
    
    # Run curation unless scrapers-only is specified
    if not args.scrapers_only:
        if not run_curation():
            success = False
    
    if success:
        logger.info("=== All tasks completed successfully ===")
    else:
        logger.error("=== Some tasks failed - check logs above ===")
        sys.exit(1)

if __name__ == "__main__":
    main()