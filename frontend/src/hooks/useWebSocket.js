import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5;

  const connect = useCallback(() => {
    // Requires JWT via query param in a real setup since WS can't pass HTTP Auth headers directly
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = `ws://localhost:8000${url}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      retryCountRef.current = 0; // Reset retries
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Auto-toast all incoming messages natively
      toast(data.message, {
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      // Further dispatch via Context or Redux could happen here
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        const delay = Math.min(1000 * (2 ** retryCountRef.current), 10000);
        console.log(`WebSocket disconnected. Reconnecting in ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      } else {
        toast.error("Live updates disconnected. Please refresh the page.");
      }
    };

    setSocket(ws);
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (socket) socket.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return { isConnected, socket };
};
