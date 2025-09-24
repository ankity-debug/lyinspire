#!/usr/bin/env python3
"""
Production-ready scheduler for daily scraping and curation workflow
"""
import schedule
import time
import logging
import os
import signal
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from pathlib import Path

# Import scrapers
from behance_scraper import scrape_behance
from dribbble_scraper import scrape_dribbble
from medium_scraper import scrape_medium
from core77_scraper import scrape_core77
from awwwards_scraper import scrape_awwwards
from curation import curate_daily_content
from database import setup_database, get_db_connection

@dataclass
class ScraperResult:
    platform: str
    success: bool
    error: Optional[str] = None
    items_scraped: int = 0
    duration: float = 0.0

@dataclass
class SchedulerConfig:
    schedule_time: str = "03:00"  # 3:00 AM IST
    max_retries: int = 3
    retry_delay: int = 300  # 5 minutes
    health_check_interval: int = 3600  # 1 hour
    log_retention_days: int = 7
    enable_health_checks: bool = True

class ProductionScheduler:
    def __init__(self, config: SchedulerConfig = None):
        self.config = config or SchedulerConfig()
        self.logger = self._setup_logging()
        self.scrapers = self._setup_scrapers()
        self.running = True
        self.last_successful_run: Optional[datetime] = None
        self.health_status: Dict[str, bool] = {}
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _setup_logging(self) -> logging.Logger:
        """Setup comprehensive logging with rotation"""
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / 'scheduler.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        logger = logging.getLogger(__name__)
        logger.info("Scheduler logging initialized")
        return logger
    
    def _setup_scrapers(self) -> List[Tuple[str, callable, bool]]:
        """Setup scraper configuration with optional requirements"""
        return [
            ("Medium", scrape_medium, True),  # Always available
            ("Core77", scrape_core77, True),  # Always available
            ("Awwwards", scrape_awwwards, True),  # Always available
            ("Behance", scrape_behance, bool(os.environ.get('BEHANCE_API_KEY'))),
            ("Dribbble", scrape_dribbble, bool(os.environ.get('DRIBBBLE_ACCESS_TOKEN'))),
        ]
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        self.logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.running = False
    
    def _validate_environment(self) -> bool:
        """Validate required environment variables"""
        required_vars = ['DATABASE_URL']
        missing_vars = [var for var in required_vars if not os.environ.get(var)]
        
        if missing_vars:
            self.logger.error(f"Missing required environment variables: {missing_vars}")
            return False
        
        optional_vars = ['BEHANCE_API_KEY', 'DRIBBBLE_ACCESS_TOKEN']
        missing_optional = [var for var in optional_vars if not os.environ.get(var)]
        
        if missing_optional:
            self.logger.warning(f"Missing optional environment variables: {missing_optional}")
            self.logger.warning("Some scrapers will be skipped")
        
        return True
    
    def _run_scraper_with_retry(self, platform: str, scraper_func: callable) -> ScraperResult:
        """Run a single scraper with retry logic"""
        start_time = time.time()
        
        for attempt in range(self.config.max_retries + 1):
            try:
                self.logger.info(f"Scraping {platform} (attempt {attempt + 1})")
                
                # Run the scraper
                result = scraper_func()
                
                duration = time.time() - start_time
                self.logger.info(f"✓ {platform} scraping completed successfully in {duration:.2f}s")
                
                return ScraperResult(
                    platform=platform,
                    success=True,
                    items_scraped=getattr(result, 'items_scraped', 0),
                    duration=duration
                )
                
            except Exception as e:
                self.logger.error(f"✗ {platform} scraping failed (attempt {attempt + 1}): {e}")
                
                if attempt < self.config.max_retries:
                    self.logger.info(f"Retrying {platform} in {self.config.retry_delay} seconds...")
                    time.sleep(self.config.retry_delay)
                else:
                    duration = time.time() - start_time
                    return ScraperResult(
                        platform=platform,
                        success=False,
                        error=str(e),
                        duration=duration
                    )
    
    def _run_curation_with_retry(self) -> bool:
        """Run curation with retry logic"""
        for attempt in range(self.config.max_retries + 1):
            try:
                self.logger.info(f"Running curation (attempt {attempt + 1})")
                curate_daily_content()
                self.logger.info("✓ Curation completed successfully")
                return True
                
            except Exception as e:
                self.logger.error(f"✗ Curation failed (attempt {attempt + 1}): {e}")
                
                if attempt < self.config.max_retries:
                    self.logger.info(f"Retrying curation in {self.config.retry_delay} seconds...")
                    time.sleep(self.config.retry_delay)
        
        return False
    
    def _perform_health_check(self) -> Dict[str, bool]:
        """Perform system health checks"""
        health_status = {}
        
        try:
            # Database connectivity check
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            conn.close()
            health_status['database'] = True
            self.logger.debug("Database health check: OK")
        except Exception as e:
            health_status['database'] = False
            self.logger.error(f"Database health check failed: {e}")
        
        # Check scraper requirements
        for platform, _, available in self.scrapers:
            health_status[f'scraper_{platform.lower()}'] = available
        
        return health_status
    
    def _save_run_results(self, results: List[ScraperResult], curation_success: bool):
        """Save run results for monitoring"""
        run_data = {
            'timestamp': datetime.now().isoformat(),
            'scrapers': [
                {
                    'platform': r.platform,
                    'success': r.success,
                    'error': r.error,
                    'items_scraped': r.items_scraped,
                    'duration': r.duration
                }
                for r in results
            ],
            'curation_success': curation_success,
            'health_status': self.health_status
        }
        
        # Save to log file
        log_file = Path("logs") / "run_history.jsonl"
        with open(log_file, "a") as f:
            f.write(json.dumps(run_data) + "\n")
    
    def run_daily_scraping(self):
        """Run the complete daily scraping and curation process"""
        self.logger.info(f"=== Starting daily scraping process at {datetime.now()} ===")
        
        try:
            # Environment validation
            if not self._validate_environment():
                self.logger.error("Environment validation failed, aborting")
                return
            
            # Database setup
            self.logger.info("Setting up database connection...")
            setup_database()
            
            # Health check
            if self.config.enable_health_checks:
                self.health_status = self._perform_health_check()
                if not self.health_status.get('database', False):
                    self.logger.error("Database health check failed, aborting")
                    return
            
            # Run scrapers
            results = []
            successful_scrapers = 0
            
            for platform, scraper_func, available in self.scrapers:
                if not available:
                    self.logger.info(f"⏭️  Skipping {platform} (requirements not met)")
                    continue
                
                result = self._run_scraper_with_retry(platform, scraper_func)
                results.append(result)
                
                if result.success:
                    successful_scrapers += 1
            
            # Run curation if at least one scraper succeeded
            curation_success = False
            if successful_scrapers > 0:
                self.logger.info("Running curation algorithm...")
                curation_success = self._run_curation_with_retry()
            else:
                self.logger.warning("No scrapers succeeded, skipping curation")
            
            # Save results and update status
            self._save_run_results(results, curation_success)
            
            if successful_scrapers > 0 and curation_success:
                self.last_successful_run = datetime.now()
                self.logger.info("✅ Daily scraping process completed successfully")
            else:
                self.logger.warning(f"⚠️  Daily scraping partially failed: {successful_scrapers}/{len([s for s in self.scrapers if s[2]])} scrapers succeeded, curation: {curation_success}")
            
            # Print summary
            self.logger.info("=== Scraping Summary ===")
            for result in results:
                status = "✓" if result.success else "✗"
                self.logger.info(f"{status} {result.platform}: {result.duration:.2f}s")
            
            self.logger.info(f"=== Process completed at {datetime.now()} ===")
            
        except Exception as e:
            self.logger.error(f"Critical error in daily scraping process: {e}")
    
    def start_scheduler(self):
        """Start the scheduler with health monitoring"""
        self.logger.info(f"🚀 Production scheduler starting...")
        self.logger.info(f"📅 Scheduled daily scraping at {self.config.schedule_time} IST")
        
        # Validate environment at startup
        if not self._validate_environment():
            self.logger.error("❌ Environment validation failed, exiting")
            sys.exit(1)
        
        # Schedule the main job
        schedule.every().day.at(self.config.schedule_time).do(self.run_daily_scraping)
        
        # Schedule health checks if enabled
        if self.config.enable_health_checks:
            schedule.every(self.config.health_check_interval).seconds.do(self._perform_health_check)
        
        self.logger.info("⏰ Scheduler started. Waiting for scheduled jobs...")
        
        # Main scheduler loop
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
                
                # Log heartbeat every hour
                if datetime.now().minute == 0:
                    next_run = schedule.next_run()
                    self.logger.info(f"💓 Scheduler heartbeat - Next run: {next_run}")
                    
            except Exception as e:
                self.logger.error(f"Scheduler loop error: {e}")
                time.sleep(60)  # Continue after errors
        
        self.logger.info("🛑 Scheduler shutdown completed")

def main():
    """Main entry point"""
    # Create configuration from environment
    config = SchedulerConfig(
        schedule_time=os.environ.get('SCHEDULE_TIME', '03:00'),
        max_retries=int(os.environ.get('MAX_RETRIES', '3')),
        retry_delay=int(os.environ.get('RETRY_DELAY', '300')),
        health_check_interval=int(os.environ.get('HEALTH_CHECK_INTERVAL', '3600')),
        enable_health_checks=os.environ.get('ENABLE_HEALTH_CHECKS', 'true').lower() == 'true'
    )
    
    # Start scheduler
    scheduler = ProductionScheduler(config)
    
    try:
        scheduler.start_scheduler()
    except KeyboardInterrupt:
        scheduler.logger.info("Received keyboard interrupt, shutting down...")
    except Exception as e:
        scheduler.logger.error(f"Scheduler crashed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()