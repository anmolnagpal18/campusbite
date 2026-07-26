from django.core.cache import cache
from dashboard.queries import query_vendor_dashboard, query_college_dashboard, query_super_admin_dashboard

class VendorAnalyticsService:
    @staticmethod
    def get_analytics(vendor_profile, start_date, end_date):
        cache_key = f"db_vendor_{vendor_profile.uuid}_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}"
        data = cache.get(cache_key)
        if not data:
            data = query_vendor_dashboard(vendor_profile, start_date, end_date)
            cache.set(cache_key, data, timeout=30) # 30 seconds cache
        return data

class CollegeAnalyticsService:
    @staticmethod
    def get_analytics(college_admin_profile, start_date, end_date):
        college_id = college_admin_profile.college_id
        cache_key = f"db_college_{college_id}_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}"
        data = cache.get(cache_key)
        if not data:
            data = query_college_dashboard(college_admin_profile, start_date, end_date)
            cache.set(cache_key, data, timeout=60) # 60 seconds cache
        return data

class SuperAdminAnalyticsService:
    @staticmethod
    def get_analytics(start_date, end_date):
        cache_key = f"db_super_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}"
        data = cache.get(cache_key)
        if not data:
            data = query_super_admin_dashboard(start_date, end_date)
            cache.set(cache_key, data, timeout=60) # 60 seconds cache
        return data

def invalidate_dashboard_caches():
    """
    Invalidates the dashboard analytics cache.
    Called when orders update status, vendors get registered/deactivated, or canteens edit settings.
    """
    cache.clear()
