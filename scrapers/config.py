#!/usr/bin/env python3
"""
Configuration management for the scraping and scheduling system
"""
import os
from typing import Dict, Any
from dataclasses import dataclass

@dataclass
class ScrapingConfig:
    """Configuration for scraping operations"""
    # Database
    database_url: str
    
    # Scheduler settings
    schedule_time: str = "03:00"
    max_retries: int = 3
    retry_delay: int = 300
    health_check_interval: int = 3600
    enable_health_checks: bool = True
    
    # API keys (optional)
    behance_api_key: str | None = None
    dribbble_access_token: str | None = None
    
    # Logging
    log_level: str = "INFO"
    log_retention_days: int = 7
    
    # Environment
    environment: str = "production"

def load_config() -> ScrapingConfig:
    """Load configuration from environment variables"""
    return ScrapingConfig(
        database_url=os.getenv('DATABASE_URL', ''),
        schedule_time=os.getenv('SCHEDULE_TIME', '03:00'),
        max_retries=int(os.getenv('MAX_RETRIES', '3')),
        retry_delay=int(os.getenv('RETRY_DELAY', '300')),
        health_check_interval=int(os.getenv('HEALTH_CHECK_INTERVAL', '3600')),
        enable_health_checks=os.getenv('ENABLE_HEALTH_CHECKS', 'true').lower() == 'true',
        behance_api_key=os.getenv('BEHANCE_API_KEY'),
        dribbble_access_token=os.getenv('DRIBBBLE_ACCESS_TOKEN'),
        log_level=os.getenv('LOG_LEVEL', 'INFO'),
        log_retention_days=int(os.getenv('LOG_RETENTION_DAYS', '7')),
        environment=os.getenv('NODE_ENV', 'production')
    )

def validate_config(config: ScrapingConfig) -> Dict[str, str]:
    """Validate configuration and return any errors"""
    errors = {}
    
    if not config.database_url:
        errors['database_url'] = 'DATABASE_URL is required'
    
    if config.max_retries < 0:
        errors['max_retries'] = 'MAX_RETRIES must be >= 0'
    
    if config.retry_delay < 0:
        errors['retry_delay'] = 'RETRY_DELAY must be >= 0'
    
    # Validate schedule time format (HH:MM)
    try:
        hour, minute = config.schedule_time.split(':')
        hour, minute = int(hour), int(minute)
        if not (0 <= hour <= 23 and 0 <= minute <= 59):
            raise ValueError()
    except:
        errors['schedule_time'] = 'SCHEDULE_TIME must be in HH:MM format (24-hour)'
    
    return errors

def get_platform_availability() -> Dict[str, bool]:
    """Check which platform scrapers are available based on configuration"""
    config = load_config()
    
    return {
        'medium': True,  # No API key required
        'core77': True,  # No API key required  
        'awwwards': True,  # No API key required
        'behance': bool(config.behance_api_key),
        'dribbble': bool(config.dribbble_access_token),
    }

def print_config_status():
    """Print current configuration status for debugging"""
    config = load_config()
    availability = get_platform_availability()
    errors = validate_config(config)
    
    print("=== Scraper Configuration Status ===")
    print(f"Environment: {config.environment}")
    print(f"Schedule Time: {config.schedule_time} IST")
    print(f"Max Retries: {config.max_retries}")
    print(f"Database: {'✓ Configured' if config.database_url else '✗ Missing'}")
    print()
    
    print("Platform Availability:")
    for platform, available in availability.items():
        status = "✓ Available" if available else "✗ API key missing"
        print(f"  {platform.capitalize()}: {status}")
    print()
    
    if errors:
        print("Configuration Errors:")
        for key, error in errors.items():
            print(f"  ✗ {key}: {error}")
    else:
        print("✅ Configuration is valid")

if __name__ == "__main__":
    print_config_status()