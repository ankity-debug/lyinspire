from datetime import datetime, timedelta
import math

def calculate_score(inspiration_data):
    """
    Calculate inspiration score based on multiple factors
    
    Scoring Formula:
    - Engagement metrics: 45%
    - Image quality: 15% (mock implementation)
    - Recency: 10%
    - Tag relevance: 10%
    - Editorial override: 20% (handled elsewhere)
    """
    
    score = 0
    
    # Engagement metrics (45%)
    engagement_score = calculate_engagement_score(inspiration_data.get('sourceMeta', {}))
    score += engagement_score * 0.45
    
    # Image quality (15%) - mock implementation
    image_quality_score = 50  # Default score, would use actual image analysis
    if inspiration_data.get('thumbnailUrl'):
        image_quality_score = 70  # Bonus for having thumbnail
    score += image_quality_score * 0.15
    
    # Recency (10%)
    recency_score = calculate_recency_score(inspiration_data.get('publishedAt'))
    score += recency_score * 0.10
    
    # Tag relevance (10%)
    tag_relevance_score = calculate_tag_relevance_score(inspiration_data.get('tags', []))
    score += tag_relevance_score * 0.10
    
    # Platform bonus (20%)
    platform_score = calculate_platform_score(inspiration_data.get('platform', ''))
    score += platform_score * 0.20
    
    return min(max(score, 0), 100)  # Clamp between 0-100

def calculate_engagement_score(source_meta):
    """Calculate score based on likes, views, comments"""
    likes = source_meta.get('likes', 0)
    views = source_meta.get('views', 0)
    comments = source_meta.get('comments', 0)
    
    # Normalize engagement metrics
    like_score = min(math.log(likes + 1) * 10, 100)
    view_score = min(math.log(views + 1) * 5, 100)
    comment_score = min(comments * 2, 100)
    
    # Weighted average
    return (like_score * 0.5 + view_score * 0.3 + comment_score * 0.2)

def calculate_recency_score(published_at):
    """Calculate score based on how recent the content is"""
    if not published_at:
        return 30  # Default for unknown dates
    
    now = datetime.now()
    if published_at.tzinfo:
        now = now.replace(tzinfo=published_at.tzinfo)
    
    days_old = (now - published_at).days
    
    if days_old <= 1:
        return 100
    elif days_old <= 7:
        return 80
    elif days_old <= 30:
        return 60
    elif days_old <= 90:
        return 40
    else:
        return 20

def calculate_tag_relevance_score(tags):
    """Calculate score based on tag relevance to design"""
    if not tags:
        return 30
    
    high_value_tags = [
        'UI Design', 'UX Design', 'Web Design', 'Mobile Design', 
        'Branding', 'Typography', 'Illustration', 'Product Design'
    ]
    
    medium_value_tags = [
        'Design', 'Creative', 'Art', 'Visual', 'Digital',
        'Graphic Design', 'Logo', 'Interface'
    ]
    
    score = 30  # Base score
    
    for tag in tags:
        tag_lower = tag.lower()
        if any(hvt.lower() in tag_lower for hvt in high_value_tags):
            score += 15
        elif any(mvt.lower() in tag_lower for mvt in medium_value_tags):
            score += 8
    
    return min(score, 100)

def calculate_platform_score(platform):
    """Calculate score based on platform credibility"""
    platform_scores = {
        'Behance': 85,
        'Dribbble': 80,
        'Awwwards': 90,
        'Core77': 75,
        'Medium': 70,
    }
    
    return platform_scores.get(platform, 50)