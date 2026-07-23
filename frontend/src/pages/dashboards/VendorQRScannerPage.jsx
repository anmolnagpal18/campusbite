import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axiosClient from '../../config/axios';
import toast from 'react-hot-toast';

const VendorQRScannerPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: {width: 250, height: 250} },
      /* verbose= */ false
    );

    const onScanSuccess = async (decodedText) => {
      // Pause scanner while verifying
      scanner.pause();
      setLoading(true);

      try {
        const payload = JSON.parse(decodedText);
        
        if (!payload.booking_reference || !payload.secure_token) {
          throw new Error("Invalid QR format");
        }

        const res = await axiosClient.post('/qr/verify/', payload);
        toast.success(res.data.message || "QR Verified! Order Pickup Complete.");
        setScanResult({ success: true, message: res.data.message });

      } catch (err) {
        toast.error(err.response?.data?.error || err.message || "Verification Failed");
        setScanResult({ success: false, message: err.response?.data?.error || err.message });
      } finally {
        setLoading(false);
        // Resume after 3 seconds
        setTimeout(() => {
          setScanResult(null);
          scanner.resume();
        }, 3000);
      }
    };

    scanner.render(onScanSuccess, (err) => { /* ignore frame errors */ });

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear html5QrcodeScanner. ", error));
    };
  }, []);

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">QR Scanner</h2>
        <p className="text-slate-500 text-sm">Scan a student's QR code to verify pickup.</p>
      </div>

      <div className="bg-slate-900 p-2 rounded-xl shadow-lg overflow-hidden relative">
        <div id="qr-reader" className="w-full bg-black rounded-lg"></div>
        
        {loading && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
            <span className="text-white font-bold animate-pulse">Verifying Security Token...</span>
          </div>
        )}

        {scanResult && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${scanResult.success ? 'bg-green-600/90' : 'bg-red-600/90'}`}>
            <h3 className="text-white font-bold text-2xl mb-2">{scanResult.success ? 'Verified!' : 'Failed'}</h3>
            <p className="text-white/90">{scanResult.message}</p>
          </div>
        )}
      </div>

      <div className="text-center">
        <button className="text-blue-600 font-medium text-sm hover:underline">Manual Verification Fallback &rarr;</button>
      </div>
    </div>
  );
};

export default VendorQRScannerPage;
