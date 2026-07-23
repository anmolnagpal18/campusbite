import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axiosClient from '../../config/axios';
import { Loader } from '../../components/Loader';
import { EmptyState } from '../../components/EmptyState';
import toast from 'react-hot-toast';

const StudentQRCodePage = ({ bookingId }) => {
  const [qrPayload, setQrPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await axiosClient.post(`/qr/${bookingId}/generate/`);
        setQrPayload(JSON.stringify(res.data));
      } catch (err) {
        setError(err.response?.data?.error || "Failed to generate QR Code. Make sure the booking is Paid and Confirmed.");
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) fetchQR();
  }, [bookingId]);

  if (loading) return <Loader />;
  if (error) return <div className="p-8 max-w-sm mx-auto mt-10"><EmptyState title="QR Error" message={error} /></div>;

  return (
    <div className="max-w-sm mx-auto mt-10 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Order Ready</h2>
      <p className="text-slate-500 mb-6 text-sm">Show this QR code to the vendor to pick up your food.</p>
      
      <div className="bg-white p-4 rounded-xl inline-block shadow-sm border-2 border-slate-100">
        <QRCodeSVG 
          value={qrPayload} 
          size={220} 
          bgColor={"#ffffff"}
          fgColor={"#0f172a"}
          level={"H"}
        />
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">This code is cryptographically signed and expires after your pickup window.</p>
      </div>
    </div>
  );
};

export default StudentQRCodePage;
