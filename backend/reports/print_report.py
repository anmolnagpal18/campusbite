from django.http import HttpResponse
from dashboard.queries import query_vendor_dashboard, query_college_dashboard, query_super_admin_dashboard

def generate_vendor_print(vendor_profile, start_date, end_date):
    data = query_vendor_dashboard(vendor_profile, start_date, end_date)
    summary = data.get("summary", {})
    top_selling = data.get("tables", {}).get("top_selling_items", [])

    html = f"""
    <html>
    <head>
        <title>CampusBite Vendor Performance Report</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }}
            h1 {{ border-bottom: 2px solid #5b21b6; color: #5b21b6; padding-bottom: 10px; }}
            .meta {{ margin-bottom: 20px; font-size: 14px; color: #666; }}
            .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }}
            .card {{ border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fafafa; }}
            .card h3 {{ margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #888; }}
            .card p {{ margin: 0; font-size: 20px; font-weight: bold; color: #111; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
            th {{ background-color: #f3f4f6; font-weight: bold; }}
            @media print {{
                button {{ display: none; }}
                body {{ margin: 0; }}
            }}
        </style>
    </head>
    <body onload="window.print()">
        <button onclick="window.print()" style="padding: 10px 20px; background: #5b21b6; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">Print Report</button>
        <h1>CampusBite Canteen Report</h1>
        <div class="meta">
            <strong>Canteen Owner:</strong> {vendor_profile.user.email}<br/>
            <strong>Reporting Window:</strong> {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}
        </div>

        <div class="grid">
            <div class="card"><h3>Today's Orders</h3><p>{summary.get("today_orders", 0)}</p></div>
            <div class="card"><h3>Today's Revenue</h3><p>₹{summary.get("today_revenue", 0.00):,.2f}</p></div>
            <div class="card"><h3>Average Order Value</h3><p>₹{summary.get("average_order_value", 0.00):,.2f}</p></div>
            <div class="card"><h3>Completed Orders</h3><p>{summary.get("completed_orders", 0)}</p></div>
            <div class="card"><h3>Cancelled Orders</h3><p>{summary.get("cancelled_orders", 0)}</p></div>
            <div class="card"><h3>Avg Preparation Time</h3><p>{summary.get("average_preparation_time", 0.0)} mins</p></div>
        </div>

        <h2>Top Selling Items</h2>
        <table>
            <thead>
                <tr>
                    <th>Food Item</th>
                    <th>Orders Count</th>
                    <th>Quantity Sold</th>
                    <th>Revenue (₹)</th>
                </tr>
            </thead>
            <tbody>
                {"".join(f"<tr><td>{item.get('food_name')}</td><td>{item.get('orders')}</td><td>{item.get('quantity')}</td><td>₹{item.get('revenue'):,.2f}</td></tr>" for item in top_selling)}
            </tbody>
        </table>
    </body>
    </html>
    """
    return HttpResponse(html, content_type='text/html')

def generate_college_print(college_admin_profile, start_date, end_date):
    data = query_college_dashboard(college_admin_profile, start_date, end_date)
    summary = data.get("summary", {})
    restaurants = data.get("tables", {}).get("restaurants", [])

    html = f"""
    <html>
    <head>
        <title>CampusBite Campus Restaurants Report</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }}
            h1 {{ border-bottom: 2px solid #5b21b6; color: #5b21b6; padding-bottom: 10px; }}
            .meta {{ margin-bottom: 20px; font-size: 14px; color: #666; }}
            .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }}
            .card {{ border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fafafa; }}
            .card h3 {{ margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #888; }}
            .card p {{ margin: 0; font-size: 20px; font-weight: bold; color: #111; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
            th {{ background-color: #f3f4f6; font-weight: bold; }}
            @media print {{
                button {{ display: none; }}
                body {{ margin: 0; }}
            }}
        </style>
    </head>
    <body onload="window.print()">
        <button onclick="window.print()" style="padding: 10px 20px; background: #5b21b6; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">Print Report</button>
        <h1>Campus Canteens Performance Report</h1>
        <div class="meta">
            <strong>College:</strong> {college_admin_profile.college.name}<br/>
            <strong>Reporting Window:</strong> {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}
        </div>

        <div class="grid">
            <div class="card"><h3>Total Restaurants</h3><p>{summary.get("total_restaurants", 0)}</p></div>
            <div class="card"><h3>Today's Orders</h3><p>{summary.get("today_orders", 0)}</p></div>
            <div class="card"><h3>Today's Revenue</h3><p>₹{summary.get("today_revenue", 0.00):,.2f}</p></div>
            <div class="card"><h3>Completed Orders</h3><p>{summary.get("completed_orders", 0)}</p></div>
            <div class="card"><h3>Pending Orders</h3><p>{summary.get("pending_orders", 0)}</p></div>
            <div class="card"><h3>Total Staff</h3><p>{summary.get("total_staff", 0)}</p></div>
        </div>

        <h2>Restaurant Breakdowns</h2>
        <table>
            <thead>
                <tr>
                    <th>Restaurant</th>
                    <th>Vendor</th>
                    <th>Revenue (₹)</th>
                    <th>Orders (Range)</th>
                    <th>Completed %</th>
                    <th>Cancelled %</th>
                    <th>Staff Count</th>
                    <th>Average Order Value (₹)</th>
                </tr>
            </thead>
            <tbody>
                {"".join(f"<tr><td>{r.get('restaurant')}</td><td>{r.get('vendor')}</td><td>₹{r.get('revenue'):,.2f}</td><td>{r.get('today_orders')}</td><td>{r.get('completed_percentage')}%</td><td>{r.get('cancelled_percentage')}%</td><td>{r.get('staff')}</td><td>₹{r.get('average_order_value'):,.2f}</td></tr>" for r in restaurants)}
            </tbody>
        </table>
    </body>
    </html>
    """
    return HttpResponse(html, content_type='text/html')

def generate_platform_print(start_date, end_date):
    data = query_super_admin_dashboard(start_date, end_date)
    summary = data.get("summary", {})
    colleges = data.get("tables", {}).get("colleges", [])

    html = f"""
    <html>
    <head>
        <title>CampusBite Global Platform Performance Report</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }}
            h1 {{ border-bottom: 2px solid #5b21b6; color: #5b21b6; padding-bottom: 10px; }}
            .meta {{ margin-bottom: 20px; font-size: 14px; color: #666; }}
            .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }}
            .card {{ border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fafafa; }}
            .card h3 {{ margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #888; }}
            .card p {{ margin: 0; font-size: 20px; font-weight: bold; color: #111; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
            th {{ background-color: #f3f4f6; font-weight: bold; }}
            @media print {{
                button {{ display: none; }}
                body {{ margin: 0; }}
            }}
        </style>
    </head>
    <body onload="window.print()">
        <button onclick="window.print()" style="padding: 10px 20px; background: #5b21b6; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">Print Global Report</button>
        <h1>CampusBite Global Platform Executive Summary</h1>
        <div class="meta">
            <strong>Scope:</strong> Platform-wide Global<br/>
            <strong>Reporting Window:</strong> {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}
        </div>

        <div class="grid">
            <div class="card"><h3>Total Colleges</h3><p>{summary.get("total_colleges", 0)}</p></div>
            <div class="card"><h3>Total Restaurants</h3><p>{summary.get("total_restaurants", 0)}</p></div>
            <div class="card"><h3>Total Users</h3><p>{summary.get("total_users", 0)}</p></div>
            <div class="card"><h3>Today's Orders</h3><p>{summary.get("today_orders", 0)}</p></div>
            <div class="card"><h3>Today's Revenue</h3><p>₹{summary.get("today_revenue", 0.00):,.2f}</p></div>
            <div class="card"><h3>Growth Percentage</h3><p>{summary.get("growth_percentage", 0.0)}%</p></div>
        </div>

        <h2>Colleges Metrics comparison</h2>
        <table>
            <thead>
                <tr>
                    <th>College Name</th>
                    <th>Restaurants</th>
                    <th>Vendors</th>
                    <th>Staff count</th>
                    <th>Orders (Range)</th>
                    <th>Revenue (₹)</th>
                </tr>
            </thead>
            <tbody>
                {"".join(f"<tr><td>{col.get('college')}</td><td>{col.get('restaurants')}</td><td>{col.get('vendors')}</td><td>{col.get('staff')}</td><td>{col.get('orders')}</td><td>₹{col.get('revenue'):,.2f}</td></tr>" for col in colleges)}
            </tbody>
        </table>
    </body>
    </html>
    """
    return HttpResponse(html, content_type='text/html')
