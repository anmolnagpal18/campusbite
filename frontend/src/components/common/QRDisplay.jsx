import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { QrCode, Download, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

export const QRDisplay = ({ order }) => {
  const [qrSrc, setQrSrc] = useState('');

  const order_uuid = order?.qr_data?.order_uuid;
  const encrypted_token = order?.qr_data?.encrypted_token;

  useEffect(() => {
    if (order_uuid && encrypted_token) {
      const scanDataStr = JSON.stringify({ order_uuid, encrypted_token });
      QRCode.toDataURL(scanDataStr, { width: 250, margin: 1 }, (err, url) => {
        if (err) {
          console.error(err);
        } else {
          setQrSrc(url);
        }
      });
    }
  }, [order_uuid, encrypted_token]);

  if (!order || !order.qr_data) return null;

  const handleDownload = () => {
    if (!qrSrc) return;
    const link = document.createElement('a');
    link.href = qrSrc;
    link.download = `QR-${order.order_number}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code downloaded successfully!');
  };

  return (
    <Card className="p-6 border border-white/5 bg-[#121020]/60 backdrop-blur-md max-w-sm mx-auto text-center space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5 text-purple-400" />
          One-Time QR Pickup
        </h3>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Show this QR code to the canteen vendor or staff to claim and complete your food pickup.
        </p>
      </div>

      {/* QR Code Wrapper */}
      <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl shadow-purple-500/10 border border-purple-500/20">
        {qrSrc ? (
          <img 
            src={qrSrc} 
            alt={`Order QR Code for ${order.order_number}`}
            className="w-48 h-48 object-contain"
          />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">
            Generating...
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>QR Active & Secure</span>
        </div>

        <Button
          variant="outline"
          className="w-full py-2.5 text-xs"
          onClick={handleDownload}
          icon={<Download className="h-4 w-4" />}
          disabled={!qrSrc}
        >
          Download QR Code
        </Button>
      </div>
    </Card>
  );
};

export default QRDisplay;
