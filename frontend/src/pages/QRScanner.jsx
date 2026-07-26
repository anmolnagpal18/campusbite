import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import orderingService from '../services/ordering';

import { PageHeader } from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { QrCode, Upload, CheckCircle2, ShieldAlert, KeyRound, Camera, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const QRScanner = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [orderUuidInput, setOrderUuidInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [errorDetails, setErrorDetails] = useState('');

  // Camera Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState(null);

  // Cleanup camera scanner on unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        try {
          if (typeof scanner.stop === 'function') {
            scanner.stop()
              .then(() => {})
              .catch(err => console.log('Scanner already stopped:', err));
          }
        } catch (err) {
          console.log('Scanner cleanup error ignored:', err);
        }
      }
    };
  }, [scanner]);

  const handleDecodedData = async (text) => {
    try {
      let parsed = null;
      if (text.startsWith('{')) {
        parsed = JSON.parse(text);
      } else {
        throw new Error("Invalid QR Code content. Make sure you are scanning a CampusBite pickup QR.");
      }

      const uuid = parsed?.order_uuid || '';
      const token = parsed?.encrypted_token || '';

      if (!uuid || !token) {
        throw new Error("Missing parameters in QR Code payload.");
      }

      setLoading(true);
      setErrorDetails('');
      setVerifiedOrder(null);

      const res = await orderingService.scanQR(token, uuid);

      if (res && res.success && res.data) {
        setVerifiedOrder(res.data);
        toast.success(`Verification Successful! Order marked Completed.`);
        // Reset manual inputs
        setTokenInput('');
        setOrderUuidInput('');
        setSelectedFile(null);
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to verify scanned QR Code.';
      setErrorDetails(detail);
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Live Camera Scanning
  const toggleCameraScan = async () => {
    if (isScanning) {
      if (scanner) {
        try {
          await scanner.stop();
          setIsScanning(false);
          setScanner(null);
          toast.success("Camera scanner turned off.");
        } catch (err) {
          console.error("Failed to stop scanner:", err);
        }
      }
    } else {
      setErrorDetails('');
      setVerifiedOrder(null);
      setIsScanning(true);

      // Timeout slightly to ensure the #reader div is mounted
      setTimeout(async () => {
        const readerElement = document.getElementById("reader");
        if (!readerElement) {
          setIsScanning(false);
          setScanner(null);
          return;
        }

        try {
          const html5QrCode = new Html5Qrcode("reader");
          setScanner(html5QrCode);

          await html5QrCode.start(
            { facingMode: "environment" }, // Rear camera preferred
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            async (decodedText) => {
              // Stop camera automatically first to avoid React DOM unmounting race conditions
              try {
                await html5QrCode.stop();
                setIsScanning(false);
                setScanner(null);
              } catch (stopErr) {
                console.error(stopErr);
              }
              // On success:
              await handleDecodedData(decodedText);
            },
            (errorMessage) => {
              // Silent failure callback for standard camera frames scan loop
            }
          );
          toast.success("Camera scanner active. Position QR Code in frame.");
        } catch (err) {
          setIsScanning(false);
          setScanner(null);
          toast.error("Failed to access camera. Please check permissions.");
          console.error(err);
        }
      }, 300);
    }
  };

  // Local file QR Decoder (avoiding pyzbar dependency on backend)
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorDetails('');
      setVerifiedOrder(null);

      // Stop camera if running
      if (isScanning && scanner) {
        try {
          await scanner.stop();
          setIsScanning(false);
          setScanner(null);
        } catch (err) {
          console.error(err);
        }
      }

      setLoading(true);
      try {
        // Instantiate a decoder instance
        const html5QrCode = new Html5Qrcode("reader-file-temp");
        const decodedText = await html5QrCode.scanFile(file, false);
        await handleDecodedData(decodedText);
      } catch (err) {
        const errorMsg = "Could not decode any valid QR Code from this image.";
        setErrorDetails(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyManual = async (e) => {
    e.preventDefault();
    if (!tokenInput || !orderUuidInput) {
      toast.error('Please enter both the secure token and order UUID.');
      return;
    }

    setLoading(true);
    setErrorDetails('');
    setVerifiedOrder(null);

    try {
      const res = await orderingService.scanQR(tokenInput, orderUuidInput);
      if (res && res.success && res.data) {
        setVerifiedOrder(res.data);
        toast.success(`Verification Successful! Order marked Completed.`);
        setTokenInput('');
        setOrderUuidInput('');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to verify details.';
      setErrorDetails(detail);
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="Pickup QR Verification Console" 
        description="Verify student food pickups using live camera scanning, local file uploads, or manual fallback details."
      />

      {/* Hidden dummy container for file scanning */}
      <div id="reader-file-temp" className="hidden"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Verification forms (Left col) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Method 1: Live Camera Scan */}
          <Card className="p-6 border border-white/5 bg-[#121020]/60 backdrop-blur-md space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                <Camera className="h-4 w-4" />
                Method 1: Scan with Camera
              </h3>
              <Button
                variant={isScanning ? "danger" : "primary"}
                size="sm"
                onClick={toggleCameraScan}
              >
                {isScanning ? "Stop Camera" : "Start Camera"}
              </Button>
            </div>

            {isScanning ? (
              <div className="space-y-4">
                {/* Scanner Viewport with Scanline effect */}
                <div className="relative aspect-square max-w-[320px] mx-auto overflow-hidden rounded-3xl border border-purple-500/30 bg-black shadow-inner shadow-purple-500/20">
                  <div id="reader" className="w-full h-full object-cover"></div>
                  
                  {/* Neon Scan Overlay */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_8px_#a855f7] animate-scanline pointer-events-none"></div>
                </div>
                <p className="text-[10px] text-center text-gray-400">
                  Center the customer's QR code within the screen scan guidelines.
                </p>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-full inline-block">
                  <Camera className="h-6 w-6 animate-pulse" />
                </div>
                <p className="text-xs font-bold text-gray-300">Camera Scanner Offline</p>
                <p className="text-[10px] text-gray-500 max-w-xs mx-auto">
                  Click the button above to authorize webcam/device camera access for instant QR pickup validation.
                </p>
              </div>
            )}
          </Card>

          {/* Method 2: Image Upload Decoder */}
          <Card className="p-6 border border-white/5 bg-[#121020]/60 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
              <Upload className="h-4 w-4" />
              Method 2: Upload QR Screenshot
            </h3>
            
            <div className="border border-dashed border-white/10 hover:border-purple-500/40 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-white/[0.01]">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="space-y-2">
                <div className="p-3 bg-white/5 rounded-full inline-block text-purple-400">
                  <QrCode className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-gray-300">
                  {selectedFile ? selectedFile.name : 'Click to select or drag QR image screenshot'}
                </p>
                <p className="text-[10px] text-gray-500">Decodes locally using javascript. Fast & secure.</p>
              </div>
            </div>
          </Card>

          {/* Method 3: Manual tokens */}
          <Card className="p-6 border border-white/5 bg-[#121020]/60 backdrop-blur-md">
            <form onSubmit={handleVerifyManual} className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5 border-b border-white/5 pb-3">
                <KeyRound className="h-4 w-4" />
                Method 3: Paste QR Details Fallback
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order QR UUID</label>
                  <input
                    type="text"
                    placeholder="e.g. 9f6b3b0e-..."
                    value={orderUuidInput}
                    onChange={(e) => {
                      setOrderUuidInput(e.target.value);
                      setSelectedFile(null);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-white/5 bg-[#0a0815] text-gray-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Secure Token Payload</label>
                  <input
                    type="text"
                    placeholder="Paste the full encrypted token string here..."
                    value={tokenInput}
                    onChange={(e) => {
                      setTokenInput(e.target.value);
                      setSelectedFile(null);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-white/5 bg-[#0a0815] text-gray-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full py-2.5 text-xs mt-2"
                type="submit"
                loading={loading}
                disabled={loading}
              >
                Verify & Complete Order Manually
              </Button>
            </form>
          </Card>
        </div>

        {/* Verification feedback results (Right col) */}
        <div className="lg:col-span-5 space-y-6">
          {loading && (
            <div className="glass-card p-12 text-center rounded-3xl border border-white/5 bg-[#121020]/60 flex flex-col items-center justify-center gap-4">
              <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
              <h4 className="text-xs font-bold text-gray-300">Processing QR Verification...</h4>
            </div>
          )}

          {verifiedOrder && !loading && (
            <Card className="p-6 border border-emerald-500/20 bg-emerald-500/[0.01] rounded-3xl space-y-6 animate-scale-up">
              <div className="flex gap-3 items-start">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-200 uppercase tracking-widest">Order Handed Over</h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Pickup successfully verified! Order marked Completed. Thank-you welcome message sent to customer.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-white/5 border-t border-white/5 pt-4 space-y-3 text-xs">
                <div className="flex justify-between pt-1">
                  <span className="text-gray-400">Order Number:</span>
                  <span className="font-extrabold text-gray-200">{verifiedOrder?.order_number}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-gray-400">Customer:</span>
                  <span className="font-bold text-gray-200">{verifiedOrder?.customer_email}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-gray-400">Total Bill:</span>
                  <span className="font-extrabold text-purple-400">
                    ₹{verifiedOrder?.grand_total ? parseFloat(verifiedOrder.grand_total).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {errorDetails && !loading && (
            <Card className="p-6 border border-red-500/20 bg-red-500/[0.01] rounded-3xl space-y-4 animate-scale-up">
              <div className="flex gap-3 items-start">
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full animate-bounce">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-200 uppercase tracking-widest">Verification Failed</h3>
                  <p className="text-[11px] text-red-400 mt-1">{errorDetails}</p>
                </div>
              </div>
            </Card>
          )}

          {!verifiedOrder && !errorDetails && !loading && (
            <div className="py-16 text-center space-y-3 border border-dashed border-white/5 rounded-3xl bg-[#121020]/20">
              <QrCode className="h-8 w-8 text-gray-600 mx-auto" />
              <h4 className="text-xs font-bold text-gray-400">Console Idle</h4>
              <p className="text-[10px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                Scan logs or verify details will appear here after triggering verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
