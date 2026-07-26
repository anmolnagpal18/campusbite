import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import chatService from '../services/chat';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { Search, Send, MessageSquare, ArrowLeft, Check, CheckCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const Messages = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConversationId = searchParams.get('conversationId');

  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  // Pagination states
  const [msgPage, setMsgPage] = useState(1);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Typing & Online status placeholders
  const [isTyping, setIsTyping] = useState(false); // Can be bound to socket event listener later

  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  const previousScrollHeightRef = useRef(0);

  const fetchConversations = async (showLoading = false) => {
    if (showLoading) setLoadingConvs(true);
    try {
      const res = await chatService.getConversations(searchQuery);
      if (res && res.success && res.data) {
        setConversations(res.data);
        
        if (initialConversationId && !activeConv) {
          const matched = res.data.find(c => String(c.id) === String(initialConversationId));
          if (matched) {
            handleSelectConversation(matched);
            setSearchParams({});
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoadingConvs(false);
    }
  };

  const fetchMessages = async (convId, page = 1, append = false, silent = false) => {
    if (page === 1 && !silent) {
      setLoadingMsgs(true);
    } else if (page > 1) {
      setLoadingMore(true);
    }
    
    try {
      const res = await chatService.getMessages(convId, page);
      if (res && res.success && res.data) {
        const results = res.data.results || res.data;
        const next = res.data.next;

        if (append) {
          // Prepend older messages
          setMessages(prev => [...results, ...prev]);
        } else {
          setMessages(results);
        }
        
        setHasMoreMsgs(!!next);
        setMsgPage(page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsgs(false);
      setLoadingMore(false);
    }
  };

  // Poll conversation list and active conversation messages periodically
  useEffect(() => {
    fetchConversations(true);

    const interval = setInterval(() => {
      fetchConversations(false);
      if (activeConv) {
        // Poll for new messages (keep it page 1 to fetch latest messages)
        fetchMessages(activeConv.id, 1, false, true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [searchQuery, activeConv?.id]);

  // Adjust scroll position after pagination prepend
  useEffect(() => {
    if (chatScrollContainerRef.current && msgPage > 1) {
      const container = chatScrollContainerRef.current;
      container.scrollTop = container.scrollHeight - previousScrollHeightRef.current;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSelectConversation = (conv) => {
    setActiveConv(conv);
    setMsgPage(1);
    setHasMoreMsgs(false);
    fetchMessages(conv.id, 1);
  };

  const handleScroll = () => {
    if (!chatScrollContainerRef.current || loadingMore || !hasMoreMsgs || !activeConv) return;
    
    const container = chatScrollContainerRef.current;
    
    // If scrolled to top (threshold 5px)
    if (container.scrollTop <= 5) {
      previousScrollHeightRef.current = container.scrollHeight;
      fetchMessages(activeConv.id, msgPage + 1, true);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConv) return;

    setSending(true);
    try {
      const res = await chatService.sendMessage(activeConv.id, messageInput.trim());
      if (res && res.success && res.data) {
        setMessages(prev => [...prev, res.data]);
        setMessageInput('');
        fetchConversations(false);
      }
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const getRecipient = (conv) => {
    if (!conv || !conv.participants) return { email: 'System', role: '' };
    const recipient = conv.participants.find(p => p.user.id !== user.id);
    return recipient ? recipient.user : { email: 'Unknown Participant', role: '' };
  };

  const formatRoleLabel = (role) => {
    if (!role) return '';
    return role.replace('_', ' ');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden">
      {/* Conversations List Panel */}
      <div className={`w-full md:w-80 flex flex-col glass-panel rounded-3xl border border-white/5 bg-[#0f0d1a]/60 overflow-hidden ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input text-gray-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.02]">
          {loadingConvs ? (
            <div className="py-12 flex justify-center"><Loader size="sm" /></div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">No conversations found.</div>
          ) : (
            conversations.map((conv) => {
              const r = getRecipient(conv);
              const isSelected = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left p-4 flex gap-3 hover:bg-white/[0.02] transition-colors items-start ${isSelected ? 'bg-purple-500/10 hover:bg-purple-500/10' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-200 truncate">{r.email}</span>
                      {conv.last_message && (
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest">
                        {formatRoleLabel(r.role)}
                      </span>
                      {conv.unread_count > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-black text-white bg-purple-500 rounded-full min-w-5 text-center leading-none">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-gray-400 truncate mt-1 leading-relaxed">
                        {conv.last_message.content}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message History Chat Area */}
      <div className={`flex-1 flex flex-col glass-panel rounded-3xl border border-white/5 bg-[#0f0d1a]/60 overflow-hidden ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Chat Area Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConv(null)}
                  className="md:hidden text-gray-400 hover:text-white cursor-pointer mr-1"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-gray-100">{getRecipient(activeConv).email}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                      {formatRoleLabel(getRecipient(activeConv).role)}
                    </span>
                    <span className="text-[9px] text-gray-400 font-semibold">• Status unavailable</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div 
              ref={chatScrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {loadingMsgs ? (
                <div className="h-full flex items-center justify-center"><Loader size="md" /></div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center flex-col text-center space-y-2">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-gray-400">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-200">No messages yet</h4>
                  <p className="text-xs text-gray-400 max-w-xs">Send your first message to begin the conversation.</p>
                </div>
              ) : (
                <>
                  {loadingMore && (
                    <div className="py-2 flex justify-center"><Loader size="xs" /></div>
                  )}
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender === user.id;
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-3.5 rounded-2xl leading-relaxed text-xs shadow-lg ${isOwn ? 'bg-purple-600/90 text-white rounded-tr-none' : 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none'}`}>
                          <p>{msg.content}</p>
                          <div className="flex items-center justify-end gap-1.5 mt-2 text-[9px] text-gray-300 font-semibold">
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              msg.read_at ? (
                                <CheckCheck className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Check className="h-3 w-3 text-gray-400" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="text-[10px] text-purple-400 font-semibold animate-pulse bg-purple-500/5 px-3 py-1.5 rounded-xl border border-purple-500/10">
                    {getRecipient(activeConv).email.split('@')[0]} is typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer Footer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-white/[0.01] flex gap-3">
              <input
                type="text"
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                disabled={sending}
                className="flex-1 px-4 py-3 text-xs rounded-xl glass-input text-gray-200 focus:outline-none disabled:opacity-50"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={sending || !messageInput.trim()}
                icon={<Send className="h-4 w-4" />}
              >
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-4 bg-white/5 border border-white/5 rounded-3xl text-gray-400 shadow-xl">
              <MessageSquare className="h-12 w-12 text-purple-400" />
            </div>
            <h4 className="text-base font-bold text-gray-200">Your Conversations</h4>
            <p className="text-xs text-gray-400 max-w-sm">Select a contact from the sidebar list to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
