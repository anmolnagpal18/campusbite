from reports.export_csv import generate_vendor_csv, generate_college_csv, generate_platform_csv

def generate_vendor_excel(vendor_profile, start_date, end_date):
    """
    Generates Excel-compatible spreadsheet response.
    """
    response = generate_vendor_csv(vendor_profile, start_date, end_date)
    response['Content-Type'] = 'application/vnd.ms-excel'
    response['Content-Disposition'] = f'attachment; filename="vendor_report_{start_date.strftime("%Y%m%d")}.xls"'
    return response

def generate_college_excel(college_admin_profile, start_date, end_date):
    """
    Generates Excel-compatible spreadsheet response.
    """
    response = generate_college_csv(college_admin_profile, start_date, end_date)
    response['Content-Type'] = 'application/vnd.ms-excel'
    response['Content-Disposition'] = f'attachment; filename="college_report_{start_date.strftime("%Y%m%d")}.xls"'
    return response

def generate_platform_excel(start_date, end_date):
    """
    Generates Excel-compatible spreadsheet response.
    """
    response = generate_platform_csv(start_date, end_date)
    response['Content-Type'] = 'application/vnd.ms-excel'
    response['Content-Disposition'] = f'attachment; filename="platform_report_{start_date.strftime("%Y%m%d")}.xls"'
    return response
