import datetime
from django.utils import timezone
from django.core.cache import cache

def parse_time_filter(request):
    """
    Parses request query parameters to return (start_date, end_date).
    Supports range_preset: 'today', 'yesterday', '7d', '30d', '90d', 'this_month', 'last_month'
    Also supports custom date range strings (start=YYYY-MM-DD, end=YYYY-MM-DD).
    """
    now = timezone.now()
    preset = request.query_params.get('range_preset', '').lower()
    start_param = request.query_params.get('start')
    end_param = request.query_params.get('end')

    # Handle custom dates first
    if start_param and end_param:
        try:
            s_dt = datetime.datetime.strptime(start_param, "%Y-%m-%d")
            e_dt = datetime.datetime.strptime(end_param, "%Y-%m-%d")
            # Convert to timezone aware at boundary bounds
            start_date = timezone.make_aware(datetime.datetime.combine(s_dt, datetime.time.min))
            end_date = timezone.make_aware(datetime.datetime.combine(e_dt, datetime.time.max))
            return start_date, end_date
        except ValueError:
            pass

    # Preset filters
    if preset == 'today':
        start_date = timezone.make_aware(datetime.datetime.combine(now.date(), datetime.time.min))
        end_date = timezone.make_aware(datetime.datetime.combine(now.date(), datetime.time.max))
    elif preset == 'yesterday':
        yest = now.date() - datetime.timedelta(days=1)
        start_date = timezone.make_aware(datetime.datetime.combine(yest, datetime.time.min))
        end_date = timezone.make_aware(datetime.datetime.combine(yest, datetime.time.max))
    elif preset == '7d':
        start_date = now - datetime.timedelta(days=7)
        end_date = now
    elif preset == '90d':
        start_date = now - datetime.timedelta(days=90)
        end_date = now
    elif preset == 'this_month':
        start_date = timezone.make_aware(datetime.datetime(now.year, now.month, 1))
        end_date = now
    elif preset == 'last_month':
        # Calculate first and last day of last month
        first_day_current = datetime.date(now.year, now.month, 1)
        last_day_last = first_day_current - datetime.timedelta(days=1)
        first_day_last = datetime.date(last_day_last.year, last_day_last.month, 1)
        
        start_date = timezone.make_aware(datetime.datetime.combine(first_day_last, datetime.time.min))
        end_date = timezone.make_aware(datetime.datetime.combine(last_day_last, datetime.time.max))
    else:
        # Default: 30 days
        start_date = now - datetime.timedelta(days=30)
        end_date = now

    return start_date, end_date
