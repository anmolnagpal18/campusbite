import { useState, useEffect } from 'react';
import axiosClient from '../../config/axios';
import { Loader } from '../../components/Loader';
import toast from 'react-hot-toast';

const CommunicationSettingsPage = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [platform, setPlatform] = useState('WHATSAPP');
  const [phoneNumber, setPhoneNumber] = useState('');

  const fetchChannels = async () => {
    try {
      const res = await axiosClient.get('/communication/channels/');
      setChannels(res.data);
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleAddChannel = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/communication/channels/', {
        platform,
        phone_number: platform === 'WHATSAPP' ? phoneNumber : null,
      });
      toast.success(`${platform} channel registered successfully!`);
      fetchChannels();
      setPhoneNumber('');
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    }
  };

  const verifyChannel = async (id) => {
    try {
      await axiosClient.post(`/communication/channels/${id}/verify/`);
      toast.success("Channel verified successfully!");
      fetchChannels();
    } catch (err) {
      toast.error("Verification failed");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Communication Settings</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Add Notification Channel</h3>
        <form onSubmit={handleAddChannel} className="flex gap-4">
          <select 
            className="p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="WHATSAPP">WhatsApp</option>
            <option value="TELEGRAM">Telegram</option>
          </select>
          
          {platform === 'WHATSAPP' && (
            <input 
              type="text" 
              placeholder="+1234567890" 
              className="flex-1 p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          )}
          
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
            Add
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Your Channels</h3>
        {channels.length === 0 ? (
          <p className="text-slate-500">No active channels. You will not receive push notifications.</p>
        ) : (
          <div className="space-y-4">
            {channels.map(ch => (
              <div key={ch.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{ch.platform}</h4>
                  <p className="text-sm text-slate-500">{ch.phone_number || ch.telegram_chat_id || 'Pending Link'}</p>
                </div>
                <div>
                  {ch.verified ? (
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Verified
                    </span>
                  ) : (
                    <button onClick={() => verifyChannel(ch.id)} className="text-blue-600 hover:underline text-sm font-semibold">
                      Verify Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationSettingsPage;
