import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Packet, SecurityAlert } from '../types';

interface ToastAlert {
  id: string;
  title: string;
  category: string;
  severity: string;
  time: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  livePackets: Packet[];
  activeToasts: ToastAlert[];
  dismissToast: (id: string) => void;
  lastAlert: SecurityAlert | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [livePackets, setLivePackets] = useState<Packet[]>([]);
  const [activeToasts, setActiveToasts] = useState<ToastAlert[]>([]);
  const [lastAlert, setLastAlert] = useState<SecurityAlert | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const candidateIndexRef = useRef(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const getCandidateWsUrls = (): string[] => {
      const isHttps = window.location.protocol === 'https:';
      const wsProto = isHttps ? 'wss:' : 'ws:';
      const isXampp = window.location.pathname.startsWith('/cybersentinel');

      const urls = [];
      if (isXampp) {
        urls.push(`${wsProto}//${window.location.host}/cybersentinel/api/ws`);
      }
      urls.push(`${wsProto}//${window.location.host}/api/ws`);
      // Direct backend fallbacks for XAMPP / local dev
      urls.push(`ws://127.0.0.1:8000/api/ws`);
      urls.push(`ws://localhost:8000/api/ws`);
      return Array.from(new Set(urls));
    };

    const connect = () => {
      const candidates = getCandidateWsUrls();
      const wsUrl = candidates[candidateIndexRef.current % candidates.length];

      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_PACKET') {
              setLivePackets((prev) => [data.packet, ...prev.slice(0, 99)]);
            } else if (data.type === 'NEW_SECURITY_ALERT') {
              const alert = data.alert;
              setLastAlert(alert);
              const newToast: ToastAlert = {
                id: alert.alert_id || `toast-${Date.now()}`,
                title: alert.title,
                category: alert.category,
                severity: alert.severity,
                time: 'Just now',
              };
              setActiveToasts((prev) => [newToast, ...prev.slice(0, 4)]);
            }
          } catch (e) {
            // non-json
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try next candidate endpoint if disconnected
          candidateIndexRef.current += 1;
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        candidateIndexRef.current += 1;
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const dismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        livePackets,
        activeToasts,
        dismissToast,
        lastAlert,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
