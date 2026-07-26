import csv
from django.http import HttpResponse
from dashboard.queries import query_vendor_dashboard, query_college_dashboard, query_super_admin_dashboard

def generate_vendor_csv(vendor_profile, start_date, end_date):
    """
    Generates CSV response for Vendor Daily/Range Performance.
    """
    data = query_vendor_dashboard(vendor_profile, start_date, end_date)
    summary = data.get("summary", {})
    top_selling = data.get("tables", {}).get("top_selling_items", [])
    low_stock = data.get("tables", {}).get("low_stock_items", [])

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="vendor_report_{start_date.strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(["CAMPUSBITE VENDOR PERFORMANCE REPORT"])
    writer.writerow(["Date Range", f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"])
    writer.writerow([])
    
    # Summary Metrics
    writer.writerow(["KEY PERFORMANCE INDICATORS"])
    writer.writerow(["Today's Orders", summary.get("today_orders", 0)])
    writer.writerow(["Today's Revenue (₹)", summary.get("today_revenue", 0.00)])
    writer.writerow(["Completed Orders (Range)", summary.get("completed_orders", 0)])
    writer.writerow(["Cancelled Orders (Range)", summary.get("cancelled_orders", 0)])
    writer.writerow(["Completed Percentage (%)", f'{summary.get("completed_percentage", 0.0)}%'])
    writer.writerow(["Cancelled Percentage (%)", f'{summary.get("cancelled_percentage", 0.0)}%'])
    writer.writerow(["Average Order Value (₹)", summary.get("average_order_value", 0.00)])
    writer.writerow(["Average Preparation Time (mins)", summary.get("average_preparation_time", 0.0)])
    writer.writerow(["Fastest Prep Time (mins)", summary.get("fastest_prep_time", 0.0)])
    writer.writerow(["Slowest Prep Time (mins)", summary.get("slowest_prep_time", 0.0)])
    writer.writerow(["Peak Order Hour", summary.get("peak_order_hour", "N/A")])
    writer.writerow(["Top Selling Category", summary.get("top_selling_category", "None")])
    writer.writerow([])

    # Top Selling Table
    writer.writerow(["TOP SELLING FOOD ITEMS"])
    writer.writerow(["Food Item", "Orders Count", "Quantity Sold", "Revenue (₹)"])
    for item in top_selling:
        writer.writerow([item.get("food_name"), item.get("orders"), item.get("quantity"), item.get("revenue")])
    writer.writerow([])

    # Low Stock Table
    writer.writerow(["LOW STOCK WARNINGS (Stock <= 5)"])
    writer.writerow(["Food Item", "Remaining Stock", "Status"])
    for item in low_stock:
        writer.writerow([item.get("item_name"), item.get("quantity"), item.get("availability")])

    return response

def generate_college_csv(college_admin_profile, start_date, end_date):
    """
    Generates CSV response for College Admin Campus Restaurants Report.
    """
    data = query_college_dashboard(college_admin_profile, start_date, end_date)
    summary = data.get("summary", {})
    restaurants = data.get("tables", {}).get("restaurants", [])

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="college_report_{start_date.strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(["CAMPUSBITE CAMPUS RESTAURANTS REPORT"])
    writer.writerow(["Date Range", f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"])
    writer.writerow([])

    # Summary
    writer.writerow(["CAMPUS METRICS SUMMARY"])
    writer.writerow(["Total Restaurants", summary.get("total_restaurants", 0)])
    writer.writerow(["Total Vendors", summary.get("total_vendors", 0)])
    writer.writerow(["Approved Vendors", summary.get("approved_vendors", 0)])
    writer.writerow(["Total Active Staff", summary.get("total_staff", 0)])
    writer.writerow(["Today's Orders", summary.get("today_orders", 0)])
    writer.writerow(["Today's Revenue (₹)", summary.get("today_revenue", 0.00)])
    writer.writerow(["Completed Orders (Range)", summary.get("completed_orders", 0)])
    writer.writerow(["Pending Orders (Range)", summary.get("pending_orders", 0)])
    writer.writerow([])

    # Restaurants table
    writer.writerow(["RESTAURANTS PERFORMANCE"])
    writer.writerow(["Restaurant", "Vendor", "Revenue (₹)", "Orders (Range)", "Completed %", "Cancelled %", "Staff Count", "Average Order Value (₹)", "Status"])
    for r in restaurants:
        writer.writerow([
            r.get("restaurant"), r.get("vendor"), r.get("revenue"), r.get("today_orders"),
            f'{r.get("completed_percentage")}%', f'{r.get("cancelled_percentage")}%',
            r.get("staff"), r.get("average_order_value"), r.get("status")
        ])

    return response

def generate_platform_csv(start_date, end_date):
    """
    Generates CSV response for Super Admin Platform Wide Report.
    """
    data = query_super_admin_dashboard(start_date, end_date)
    summary = data.get("summary", {})
    colleges = data.get("tables", {}).get("colleges", [])

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="platform_report_{start_date.strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(["CAMPUSBITE GLOBAL PLATFORM PERFORMANCE REPORT"])
    writer.writerow(["Date Range", f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"])
    writer.writerow([])

    # Summary
    writer.writerow(["GLOBAL PLATFORM STATS"])
    writer.writerow(["Total Colleges", summary.get("total_colleges", 0)])
    writer.writerow(["Total Restaurants", summary.get("total_restaurants", 0)])
    writer.writerow(["Total Vendors", summary.get("total_vendors", 0)])
    writer.writerow(["Total Staff", summary.get("total_staff", 0)])
    writer.writerow(["Total Users", summary.get("total_users", 0)])
    writer.writerow(["Today's Orders", summary.get("today_orders", 0)])
    writer.writerow(["Today's Revenue (₹)", summary.get("today_revenue", 0.00)])
    writer.writerow(["This Month's Orders", summary.get("monthly_orders", 0)])
    writer.writerow(["This Month's Revenue (₹)", summary.get("monthly_revenue", 0.00)])
    writer.writerow(["Monthly Growth (%)", f'{summary.get("growth_percentage", 0.0)}%'])
    writer.writerow(["Average Order Value (₹)", summary.get("average_order_value", 0.00)])
    writer.writerow(["Active Restaurants", summary.get("active_restaurants", 0)])
    writer.writerow([])

    # Colleges Table
    writer.writerow(["COLLEGES METRICS COMPARISON"])
    writer.writerow(["College", "Restaurants", "Vendors", "Staff Members", "Orders (Range)", "Revenue (₹)"])
    for col in colleges:
        writer.writerow([col.get("college"), col.get("restaurants"), col.get("vendors"), col.get("staff"), col.get("orders"), col.get("revenue")])

    return response
