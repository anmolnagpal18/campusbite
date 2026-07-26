import apiClient from '../api/client';

export const dashboardService = {
  getSuperAdminStats: async (rangePreset = '', start = '', end = '') => {
    const response = await apiClient.get('/v1/dashboard/super-admin/', {
      params: { range_preset: rangePreset, start, end }
    });
    return response.data?.success ? response.data.data : null;
  },

  getCollegeAdminStats: async (rangePreset = '', start = '', end = '') => {
    const response = await apiClient.get('/v1/dashboard/college-admin/', {
      params: { range_preset: rangePreset, start, end }
    });
    return response.data?.success ? response.data.data : null;
  },

  getVendorStats: async (rangePreset = '', start = '', end = '') => {
    const response = await apiClient.get('/v1/dashboard/vendor/', {
      params: { range_preset: rangePreset, start, end }
    });
    return response.data?.success ? response.data.data : null;
  },

  getStaffStats: async () => {
    const response = await apiClient.get('/v1/dashboard/staff/');
    return response.data?.success ? response.data.data : null;
  },

  // Secure Authenticated Exporters
  downloadReport: async (role, format, rangePreset = '', start = '', end = '') => {
    let urlPath = '';
    let filename = '';
    
    if (role === 'vendor') {
      urlPath = '/v1/reports/vendor/daily/';
      filename = `vendor_report_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xls' : 'csv'}`;
    } else if (role === 'college') {
      urlPath = '/v1/reports/college/monthly/';
      filename = `college_report_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xls' : 'csv'}`;
    } else {
      urlPath = '/v1/reports/platform/';
      filename = `platform_report_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xls' : 'csv'}`;
    }

    if (format === 'print') {
      const response = await apiClient.get(urlPath, {
        params: { format, range_preset: rangePreset, start, end }
      });
      const printWindow = window.open('', '_blank');
      printWindow.document.write(response.data);
      printWindow.document.close();
      return;
    }

    const response = await apiClient.get(urlPath, {
      params: { format, range_preset: rangePreset, start, end },
      responseType: 'blob'
    });

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  }
};

export default dashboardService;
