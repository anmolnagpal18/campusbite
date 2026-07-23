import { useState, useRef, useEffect } from 'react';
import axiosClient from '../../config/axios';
import { Loader } from '../../components/Loader';
import toast from 'react-hot-toast';

const AIChatPage = () => {
  const [messages, setMessages] = useState([
    { role: 'ASSISTANT', content: 'Hi! I am the CampusBite AI Assistant. I can help you find food, track your orders, and give recommendations. What can I do for you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'USER', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/ai/chat/', {
        message: userMsg,
        session_id: sessionId
      });
      
      setSessionId(res.data.session_id);
      setMessages(prev => [...prev, { role: 'ASSISTANT', content: res.data.response }]);
    } catch (err) {
      toast.error("AI is currently unavailable.");
      setMessages(prev => [...prev, { role: 'ASSISTANT', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg mt-6">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-t-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">AI</div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">CampusBite Assistant</h2>
            <p className="text-xs text-green-500 font-semibold">● Online</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl p-4 ${
              msg.role === 'USER' 
                ? 'bg-blue-600 text-white rounded-br-sm' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-slate-700'
            }`}>
              {/* In a real app we'd use react-markdown here */}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 rounded-bl-sm flex gap-2 items-center">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-xl">
        <form onSubmit={sendMessage} className="flex gap-3">
          <input 
            type="text" 
            placeholder="Ask about your order, menus, or recommendations..." 
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-6 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-full transition-transform active:scale-95"
          >
            <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatPage;
