import datetime
from django.db.models import Sum, Count, Avg, F, Q, ExpressionWrapper, fields
from django.db.models.functions import ExtractHour, TruncDate
from django.utils import timezone
from accounts.models import User, College, Restaurant, VendorProfile, StaffProfile, CollegeAdminProfile
from ordering.models import Order, OrderItem
from vendor.models import FoodItem, FoodCategory

def get_date_range_series(start_date, end_date):
    """
    Helper to generate a list of dates between start_date and end_date.
    """
    series = []
    curr = start_date.date()
    end = end_date.date()
    while curr <= end:
        series.append(curr)
        curr += datetime.timedelta(days=1)
    return series

# ----------------------------------------------------
# VENDOR QUERIES
# ----------------------------------------------------

def query_vendor_dashboard(vendor_profile, start_date, end_date):
    restaurant = getattr(vendor_profile, 'restaurant', None)
    if not restaurant:
        return {
            "summary": {}, "charts": {"revenue": [], "orders_status": [], "top_selling": []},
            "tables": {"top_selling_items": [], "low_stock_items": []}, "alerts": {"low_stock_count": 0}
        }

    # KPIs Base Queries
    orders_in_range = Order.objects.filter(restaurant=restaurant, created_at__range=(start_date, end_date))
    orders_all_time = Order.objects.filter(restaurant=restaurant)
    
    # Today KPIs
    today_start = timezone.make_aware(datetime.datetime.combine(timezone.now().date(), datetime.time.min))
    today_end = timezone.make_aware(datetime.datetime.combine(timezone.now().date(), datetime.time.max))
    
    today_orders_count = Order.objects.filter(restaurant=restaurant, created_at__range=(today_start, today_end)).count()
    today_revenue = Order.objects.filter(
        restaurant=restaurant,
        status=Order.OrderStatus.COMPLETED,
        payment_status=Order.PaymentStatus.SUCCESS,
        created_at__range=(today_start, today_end)
    ).aggregate(total=Sum('grand_total'))['total'] or 0.00

    # Range aggregations
    totals = orders_in_range.aggregate(
        total_count=Count('id'),
        completed_count=Count('id', filter=Q(status=Order.OrderStatus.COMPLETED)),
        cancelled_count=Count('id', filter=Q(status=Order.OrderStatus.CANCELLED)),
        preparing_count=Count('id', filter=Q(status=Order.OrderStatus.PREPARING)),
        ready_count=Count('id', filter=Q(status=Order.OrderStatus.READY)),
        pending_count=Count('id', filter=Q(status=Order.OrderStatus.PENDING)),
        success_revenue=Sum('grand_total', filter=Q(status=Order.OrderStatus.COMPLETED, payment_status=Order.PaymentStatus.SUCCESS))
    )

    total_orders = totals['total_count'] or 0
    completed_orders = totals['completed_count'] or 0
    cancelled_orders = totals['cancelled_count'] or 0
    revenue_in_range = totals['success_revenue'] or 0.00

    # Percentages
    completed_pct = round((completed_orders / total_orders * 100), 1) if total_orders > 0 else 0.0
    cancelled_pct = round((cancelled_orders / total_orders * 100), 1) if total_orders > 0 else 0.0

    # AOV
    aov = round(float(revenue_in_range) / completed_orders, 2) if completed_orders > 0 else 0.00

    # Average Prep Time (duration in minutes)
    avg_duration_delta = Order.objects.filter(
        restaurant=restaurant,
        status=Order.OrderStatus.COMPLETED,
        created_at__range=(start_date, end_date)
    ).annotate(
        duration=F('updated_at') - F('created_at')
    ).aggregate(avg_duration=Avg('duration'))['avg_duration']
    
    avg_prep_time = round(avg_duration_delta.total_seconds() / 60.0, 1) if avg_duration_delta else 0.0

    # Min/Max preparation time
    prep_deltas = Order.objects.filter(
        restaurant=restaurant,
        status=Order.OrderStatus.COMPLETED,
        created_at__range=(start_date, end_date)
    ).annotate(
        duration=F('updated_at') - F('created_at')
    ).aggregate(
        min_duration=Avg('duration'), # placeholder/minimum approximation
        max_duration=Avg('duration')
    )
    # Let's extract minimum and maximum duration using values list of duration
    durations = list(Order.objects.filter(
        restaurant=restaurant,
        status=Order.OrderStatus.COMPLETED,
        created_at__range=(start_date, end_date)
    ).annotate(
        duration=F('updated_at') - F('created_at')
    ).values_list('duration', flat=True))
    
    durations_mins = [d.total_seconds() / 60.0 for d in durations if d]
    fastest_prep = round(min(durations_mins), 1) if durations_mins else 0.0
    slowest_prep = round(max(durations_mins), 1) if durations_mins else 0.0

    # Peak Order Hour
    peak_hour_entry = orders_in_range.annotate(
        hour=ExtractHour('created_at')
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('-count').first()
    peak_hour = peak_hour_entry['hour'] if peak_hour_entry else "N/A"
    if peak_hour != "N/A":
        # Format as readable hour
        ampm = "AM" if peak_hour < 12 else "PM"
        hour_12 = peak_hour % 12
        if hour_12 == 0:
            hour_12 = 12
        peak_hour = f"{hour_12}:00 {ampm}"

    # Top Selling Category
    top_cat_entry = OrderItem.objects.filter(
        order__restaurant=restaurant,
        order__status=Order.OrderStatus.COMPLETED,
        order__payment_status=Order.PaymentStatus.SUCCESS,
        order__created_at__range=(start_date, end_date)
    ).values(
        'food_item__category__category_name'
    ).annotate(
        total_sold=Sum('quantity')
    ).order_by('-total_sold').first()
    top_selling_category = top_cat_entry['food_item__category__category_name'] if top_cat_entry else "None"

    # Inventory Metrics
    total_categories = FoodCategory.objects.filter(restaurant=restaurant).count()
    total_food_items = FoodItem.objects.filter(category__restaurant=restaurant).count()
    available_items = FoodItem.objects.filter(category__restaurant=restaurant, availability='AVAILABLE').count()
    
    # Low stock items list (quantity <= 5)
    LOW_STOCK_LIMIT = 5
    low_stock_items = list(FoodItem.objects.filter(
        category__restaurant=restaurant,
        quantity__lte=LOW_STOCK_LIMIT
    ).values('id', 'item_name', 'quantity', 'availability'))
    low_stock_count = len(low_stock_items)

    # Pending Staff
    pending_staff = StaffProfile.objects.filter(vendor=vendor_profile, status='PENDING').count()

    # Repeat Customers (placeholder: users placing > 1 order)
    customer_orders = orders_in_range.values('user').annotate(c=Count('id')).filter(c__gt=1).count()
    repeat_customers = customer_orders

    summary = {
        "today_orders": today_orders_count,
        "today_revenue": float(today_revenue),
        "pending_orders": totals['pending_count'] or 0,
        "preparing_orders": totals['preparing_count'] or 0,
        "ready_orders": totals['ready_count'] or 0,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        "total_categories": total_categories,
        "total_food_items": total_food_items,
        "available_items": available_items,
        "pending_staff": pending_staff,
        "completed_percentage": completed_pct,
        "cancelled_percentage": cancelled_pct,
        "average_order_value": aov,
        "average_preparation_time": avg_prep_time,
        "fastest_prep_time": fastest_prep,
        "slowest_prep_time": slowest_prep,
        "peak_order_hour": peak_hour,
        "top_selling_category": top_selling_category,
        "repeat_customers": repeat_customers
    }

    # CHARTS DATA
    # 1. Revenue trend (day-wise)
    daily_revenue_query = orders_in_range.filter(
        status=Order.OrderStatus.COMPLETED,
        payment_status=Order.PaymentStatus.SUCCESS
    ).annotate(
        day=TruncDate('created_at')
    ).values('day').annotate(
        rev=Sum('grand_total')
    ).order_by('day')
    
    daily_rev_map = {entry['day']: float(entry['rev']) for entry in daily_revenue_query}
    revenue_chart = []
    for dt in get_date_range_series(start_date, end_date):
        revenue_chart.append({
            "date": dt.strftime("%Y-%m-%d"),
            "day_name": dt.strftime("%a"),
            "Revenue": daily_rev_map.get(dt, 0.00)
        })

    # 2. Orders status Pie Chart
    orders_status_chart = [
        {"name": "Pending", "value": totals['pending_count'] or 0},
        {"name": "Preparing", "value": totals['preparing_count'] or 0},
        {"name": "Ready", "value": totals['ready_count'] or 0},
        {"name": "Completed", "value": completed_orders},
        {"name": "Cancelled", "value": cancelled_orders}
    ]

    # 3. Top selling foods Bar Chart
    top_foods_query = OrderItem.objects.filter(
        order__restaurant=restaurant,
        order__status=Order.OrderStatus.COMPLETED,
        order__payment_status=Order.PaymentStatus.SUCCESS,
        order__created_at__range=(start_date, end_date)
    ).values(
        'food_item__item_name'
    ).annotate(
        orders_count=Count('order', distinct=True),
        revenue=Sum(F('quantity') * F('price')),
        quantity_sold=Sum('quantity')
    ).order_by('-quantity_sold')[:10]

    top_selling_items = []
    top_selling_foods_chart = []
    for item in top_foods_query:
        top_selling_items.append({
            "food_name": item['food_item__item_name'],
            "orders": item['orders_count'],
            "revenue": float(item['revenue'] or 0.00),
            "quantity": item['quantity_sold']
        })
        top_selling_foods_chart.append({
            "name": item['food_item__item_name'],
            "Orders": item['orders_count'],
            "Revenue": float(item['revenue'] or 0.00),
            "Quantity": item['quantity_sold']
        })

    return {
        "summary": summary,
        "charts": {
            "revenue": revenue_chart,
            "orders_status": orders_status_chart,
            "top_selling": top_selling_foods_chart
        },
        "tables": {
            "top_selling_items": top_selling_items,
            "low_stock_items": low_stock_items
        },
        "alerts": {
            "low_stock_count": low_stock_count
        }
    }

# ----------------------------------------------------
# COLLEGE ADMIN QUERIES
# ----------------------------------------------------

def query_college_dashboard(college_admin_profile, start_date, end_date):
    college = college_admin_profile.college
    
    # Base profiles/canteens
    vendors = VendorProfile.objects.filter(college=college)
    restaurants = Restaurant.objects.filter(vendor__college=college)
    staff_count = StaffProfile.objects.filter(vendor__college=college).count()

    today_start = timezone.make_aware(datetime.datetime.combine(timezone.now().date(), datetime.time.min))
    today_end = timezone.make_aware(datetime.datetime.combine(timezone.now().date(), datetime.time.max))

    # Range and Today Orders Query
    orders_in_range = Order.objects.filter(restaurant__vendor__college=college, created_at__range=(start_date, end_date))
    
    today_orders = Order.objects.filter(restaurant__vendor__college=college, created_at__range=(today_start, today_end))
    today_orders_count = today_orders.count()
    today_revenue = today_orders.filter(
        status=Order.OrderStatus.COMPLETED,
        payment_status=Order.PaymentStatus.SUCCESS
    ).aggregate(total=Sum('grand_total'))['total'] or 0.00

    totals = orders_in_range.aggregate(
        total_count=Count('id'),
        completed_count=Count('id', filter=Q(status=Order.OrderStatus.COMPLETED)),
        pending_count=Count('id', filter=Q(status=Order.OrderStatus.PENDING)),
        success_revenue=Sum('grand_total', filter=Q(status=Order.OrderStatus.COMPLETED, payment_status=Order.PaymentStatus.SUCCESS))
    )

    summary = {
        "total_vendors": vendors.count(),
        "approved_vendors": vendors.filter(status='APPROVED').count(),
        "total_restaurants": restaurants.count(),
        "today_orders": today_orders_count,
        "today_revenue": float(today_revenue),
        "completed_orders": totals['completed_count'] or 0,
        "pending_orders": totals['pending_count'] or 0,
        "total_staff": staff_count
    }

    # Hourly orders for peak demand calculation (24 hours map)
    hourly_query = orders_in_range.annotate(
        hour=ExtractHour('created_at')
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('hour')
    
    hourly_map = {entry['hour']: entry['count'] for entry in hourly_query}
    hourly_chart = []
    for hr in range(24):
        readable_hr = f"{hr:02d}:00"
        hourly_chart.append({
            "hour": readable_hr,
            "Orders": hourly_map.get(hr, 0)
        })

    # Revenue trend & Daily orders series (30 days)
    daily_stats = orders_in_range.annotate(
        day=TruncDate('created_at')
    ).values('day').annotate(
        orders=Count('id'),
        revenue=Sum('grand_total', filter=Q(status=Order.OrderStatus.COMPLETED, payment_status=Order.PaymentStatus.SUCCESS))
    ).order_by('day')
    
    daily_stats_map = {
        entry['day']: {
            "orders": entry['orders'],
            "revenue": float(entry['revenue'] or 0.00)
        } for entry in daily_stats
    }
    
    revenue_chart = []
    orders_chart = []
    for dt in get_date_range_series(start_date, end_date):
        dt_str = dt.strftime("%Y-%m-%d")
        dt_stats = daily_stats_map.get(dt, {"orders": 0, "revenue": 0.00})
        revenue_chart.append({
            "date": dt_str,
            "Revenue": dt_stats["revenue"]
        })
        orders_chart.append({
            "date": dt_str,
            "Orders": dt_stats["orders"]
        })

    # Vendor Revenue Share Pie Chart
    vendor_share_query = Restaurant.objects.filter(
        vendor__college=college
    ).annotate(
        revenue=Sum('orders__grand_total', filter=Q(orders__status=Order.OrderStatus.COMPLETED, orders__payment_status=Order.PaymentStatus.SUCCESS))
    ).values('restaurant_name', 'revenue')
    
    vendor_share_chart = []
    for entry in vendor_share_query:
        vendor_share_chart.append({
            "name": entry['restaurant_name'],
            "value": float(entry['revenue'] or 0.00)
        })

    # Restaurant Analytics Table
    restaurant_list = []
    for r in restaurants.select_related('vendor', 'vendor__user').prefetch_related('orders'):
        r_orders = r.orders.filter(created_at__range=(today_start, today_end))
        r_today_count = r_orders.count()
        r_completed = r_orders.filter(status=Order.OrderStatus.COMPLETED).count()
        r_pending = r_orders.filter(status=Order.OrderStatus.PENDING).count()
        
        # Range aggregates
        r_range_orders = r.orders.filter(created_at__range=(start_date, end_date))
        r_range_totals = r_range_orders.aggregate(
            tot=Count('id'),
            comp=Count('id', filter=Q(status=Order.OrderStatus.COMPLETED)),
            canc=Count('id', filter=Q(status=Order.OrderStatus.CANCELLED)),
            rev=Sum('grand_total', filter=Q(status=Order.OrderStatus.COMPLETED, payment_status=Order.PaymentStatus.SUCCESS))
        )
        
        tot_count = r_range_totals['tot'] or 0
        comp_count = r_range_totals['comp'] or 0
        canc_count = r_range_totals['canc'] or 0
        tot_rev = r_range_totals['rev'] or 0.00
        
        comp_pct = round((comp_count / tot_count * 100), 1) if tot_count > 0 else 0.0
        canc_pct = round((canc_count / tot_count * 100), 1) if tot_count > 0 else 0.0
        aov = round(float(tot_rev) / comp_count, 2) if comp_count > 0 else 0.00
        r_staff = StaffProfile.objects.filter(vendor=r.vendor).count()

        restaurant_list.append({
            "id": r.id,
            "restaurant": r.restaurant_name,
            "vendor": r.vendor.user.email,
            "today_orders": r_today_count,
            "completed": r_completed,
            "pending": r_pending,
            "revenue": float(tot_rev),
            "completed_percentage": comp_pct,
            "cancelled_percentage": canc_pct,
            "staff": r_staff,
            "average_order_value": aov,
            "status": r.status,
            "accepting_orders": r.accepting_orders
        })

    return {
        "summary": summary,
        "charts": {
            "revenue": revenue_chart,
            "orders": orders_chart,
            "hourly": hourly_chart,
            "vendor_share": vendor_share_chart
        },
        "tables": {
            "restaurants": restaurant_list
        },
        "alerts": {}
    }

# ----------------------------------------------------
# SUPER ADMIN QUERIES
# ----------------------------------------------------

def query_super_admin_dashboard(start_date, end_date):
    total_colleges = College.objects.count()
    total_vendors = VendorProfile.objects.count()
    total_restaurants = Restaurant.objects.count()
    total_staff = StaffProfile.objects.count()
    total_users = User.objects.filter(role='USER').count()
    pending_admins = CollegeAdminProfile.objects.filter(status='PENDING').count()

    today_start = timezone.make_aware(datetime.datetime.combine(timezone.now().date(), datetime.time.min))
    today_end = timezone.make_aware(datetime.datetime.combine(timezone.now().date(), datetime.time.max))

    # Platform Totals Queries
    orders_in_range = Order.objects.filter(created_at__range=(start_date, end_date))
    today_orders = Order.objects.filter(created_at__range=(today_start, today_end))
    today_orders_count = today_orders.count()
    today_revenue = today_orders.filter(
        status=Order.OrderStatus.COMPLETED,
        payment_status=Order.PaymentStatus.SUCCESS
    ).aggregate(total=Sum('grand_total'))['total'] or 0.00

    # Monthly stats calculation (current month)
    now = timezone.now()
    first_day_month = timezone.make_aware(datetime.datetime(now.year, now.month, 1))
    monthly_orders_count = Order.objects.filter(created_at__gte=first_day_month).count()
    monthly_revenue = Order.objects.filter(
        created_at__gte=first_day_month,
        status=Order.OrderStatus.COMPLETED,
        payment_status=Order.PaymentStatus.SUCCESS
    ).aggregate(total=Sum('grand_total'))['total'] or 0.00

    # Calculate growth percentage: (This Month - Last Month) / Last Month * 100
    first_day_last = timezone.make_aware(datetime.datetime(
        now.year if now.month > 1 else now.year - 1,
        now.month - 1 if now.month > 1 else 12,
        1
    ))
    last_day_last = first_day_month - datetime.timedelta(seconds=1)
    
    last_month_rev = Order.objects.filter(
        created_at__range=(first_day_last, last_day_last),
        status=Order.OrderStatus.COMPLETED,
        payment_status=Order.PaymentStatus.SUCCESS
    ).aggregate(total=Sum('grand_total'))['total'] or 0.00
    
    growth_pct = 0.0
    if last_month_rev > 0:
        growth_pct = round(((float(monthly_revenue) - float(last_month_rev)) / float(last_month_rev) * 100), 1)

    range_totals = orders_in_range.aggregate(
        tot=Count('id'),
        comp=Count('id', filter=Q(status=Order.OrderStatus.COMPLETED)),
        rev=Sum('grand_total', filter=Q(status=Order.OrderStatus.COMPLETED, payment_status=Order.PaymentStatus.SUCCESS))
    )
    
    aov = round(float(range_totals['rev'] or 0.00) / (range_totals['comp'] or 1), 2)

    summary = {
        "total_colleges": total_colleges,
        "total_vendors": total_vendors,
        "total_restaurants": total_restaurants,
        "total_staff": total_staff,
        "total_users": total_users,
        "today_orders": today_orders_count,
        "today_revenue": float(today_revenue),
        "monthly_orders": monthly_orders_count,
        "monthly_revenue": float(monthly_revenue),
        "growth_percentage": growth_pct,
        "average_order_value": aov,
        "pending_admins": pending_admins,
        "active_restaurants": Restaurant.objects.filter(status='OPEN').count()
    }

    # Revenue Trend (Area Chart)
    daily_stats = orders_in_range.annotate(
        day=TruncDate('created_at')
    ).values('day').annotate(
        orders=Count('id'),
        revenue=Sum('grand_total', filter=Q(status=Order.OrderStatus.COMPLETED, payment_status=Order.PaymentStatus.SUCCESS))
    ).order_by('day')

    daily_stats_map = {
        entry['day']: {
            "orders": entry['orders'],
            "revenue": float(entry['revenue'] or 0.00)
        } for entry in daily_stats
    }

    revenue_chart = []
    growth_chart = []
    running_rev = 0.0
    for dt in get_date_range_series(start_date, end_date):
        dt_str = dt.strftime("%Y-%m-%d")
        dt_stats = daily_stats_map.get(dt, {"orders": 0, "revenue": 0.00})
        running_rev += dt_stats["revenue"]
        revenue_chart.append({
            "date": dt_str,
            "Revenue": dt_stats["revenue"]
        })
        growth_chart.append({
            "date": dt_str,
            "CumulativeRevenue": running_rev
        })

    # College Comparison Bar Chart
    college_compare_query = College.objects.annotate(
        revenue=Sum('vendors__restaurant__orders__grand_total', filter=Q(vendors__restaurant__orders__status=Order.OrderStatus.COMPLETED, vendors__restaurant__orders__payment_status=Order.PaymentStatus.SUCCESS))
    ).values('name', 'revenue')[:10]
    
    college_chart = []
    for entry in college_compare_query:
        college_chart.append({
            "name": entry['name'],
            "Revenue": float(entry['revenue'] or 0.00)
        })

    # Colleges Table
    colleges_table = []
    for col in College.objects.all():
        col_vendors = VendorProfile.objects.filter(college=col)
        col_restaurants = Restaurant.objects.filter(vendor__college=col)
        col_staff = StaffProfile.objects.filter(vendor__college=col).count()
        
        col_totals = Order.objects.filter(
            restaurant__vendor__college=col,
            created_at__range=(start_date, end_date)
        ).aggregate(
            orders=Count('id'),
            rev=Sum('grand_total', filter=Q(status=Order.OrderStatus.COMPLETED, payment_status=Order.PaymentStatus.SUCCESS))
        )
        
        colleges_table.append({
            "id": col.id,
            "college": col.name,
            "restaurants": col_restaurants.count(),
            "vendors": col_vendors.count(),
            "staff": col_staff,
            "orders": col_totals['orders'] or 0,
            "revenue": float(col_totals['rev'] or 0.00)
        })

    # Restaurants Table (Global list for drill downs)
    restaurants_table = []
    for r in Restaurant.objects.all():
        vendor_profile = r.vendor
        staff_count = StaffProfile.objects.filter(vendor=vendor_profile).count()
        r_totals = Order.objects.filter(
            restaurant=r,
            created_at__range=(start_date, end_date)
        ).aggregate(
            orders=Count('id'),
            completed=Count('id', filter=Q(status=Order.OrderStatus.COMPLETED)),
            cancelled=Count('id', filter=Q(status=Order.OrderStatus.CANCELLED)),
            rev=Sum('grand_total', filter=Q(status=Order.OrderStatus.COMPLETED, payment_status=Order.PaymentStatus.SUCCESS))
        )
        
        comp_count = r_totals['completed'] or 0
        canc_count = r_totals['cancelled'] or 0
        tot_count = r_totals['orders'] or 0
        comp_pct = round((comp_count / tot_count * 100), 1) if tot_count > 0 else 0.0
        canc_pct = round((canc_count / tot_count * 100), 1) if tot_count > 0 else 0.0
        aov = round(float(r_totals['rev'] or 0.00) / (comp_count or 1), 2)
        
        restaurants_table.append({
            "id": r.id,
            "restaurant": r.restaurant_name,
            "vendor": vendor_profile.user.email,
            "college_id": vendor_profile.college_id,
            "revenue": float(r_totals['rev'] or 0.00),
            "today_orders": comp_count,
            "completed": comp_count,
            "pending": tot_count - comp_count - canc_count,
            "completed_percentage": comp_pct,
            "cancelled_percentage": canc_pct,
            "staff": staff_count,
            "status": r.status,
            "accepting_orders": r.accepting_orders,
            "average_order_value": aov
        })

    return {
        "summary": summary,
        "charts": {
            "revenue": revenue_chart,
            "college_comparison": college_chart,
            "growth": growth_chart
        },
        "tables": {
            "colleges": colleges_table,
            "restaurants": restaurants_table
        },
        "alerts": {}
    }
