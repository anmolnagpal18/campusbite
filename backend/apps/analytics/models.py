from django.db import models
from django.conf import settings
from apps.common.models import BaseModel
from apps.universities.models import University
from apps.vendors.models import Vendor

class AnalyticsSnapshot(BaseModel):
    tenant = models.ForeignKey(University, on_delete=models.CASCADE, related_name='analytics_snapshots', null=True, blank=True)
    snapshot_date = models.DateField()
    snapshot_version = models.IntegerField(default=1)
    
    total_orders = models.IntegerField(default=0)
    completed_orders = models.IntegerField(default=0)
    cancelled_orders = models.IntegerField(default=0)
    
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    average_order_value = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    
    average_preparation_time = models.IntegerField(default=0, help_text="Minutes")
    average_wait_time = models.IntegerField(default=0, help_text="Minutes")
    
    generated_at = models.DateTimeField(auto_now_add=True)
    generation_duration_ms = models.IntegerField(default=0)

    class Meta:
        unique_together = ('tenant', 'snapshot_date', 'snapshot_version')

class VendorAnalytics(BaseModel):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='daily_analytics')
    date = models.DateField()
    
    orders = models.IntegerField(default=0)
    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    average_preparation_time = models.IntegerField(default=0)
    average_queue_length = models.IntegerField(default=0)
    average_wait_time = models.IntegerField(default=0)
    
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    cancellation_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    repeat_customer_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    peak_hour = models.TimeField(null=True, blank=True)

    class Meta:
        unique_together = ('vendor', 'date')

class StudentAnalytics(BaseModel):
    student = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='analytics')
    
    total_orders = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    average_order_value = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    
    favorite_vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    favorite_category = models.CharField(max_length=100, blank=True, null=True)
    
    recommendation_acceptance_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

class PlatformMetric(BaseModel):
    metric_name = models.CharField(max_length=100)
    metric_value = models.FloatField(default=0.0)
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    # Can track: active_websockets, notifications_sent, ai_tokens_used, ai_latency_ms
