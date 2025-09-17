import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert, AlertType, AlertSeverity } from '../types';

interface NotificationState {
  alerts: Alert[];
  unreadCount: number;
  isConnected: boolean;
  permissionGranted: boolean;
}

interface NotificationContextValue extends NotificationState {
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  removeAlert: (alertId: string) => void;
  clearAll: () => void;
  requestPermission: () => Promise<boolean>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  subscribeToWebSocket: () => void;
  unsubscribeFromWebSocket: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, setState] = useState<NotificationState>({
    alerts: [],
    unreadCount: 0,
    isConnected: false,
    permissionGranted: false,
  });

  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    timestamp: Date;
  }>>([]);

  // Initialize notification permission status
  useEffect(() => {
    const checkPermission = () => {
      if ('Notification' in window) {
        const permission = Notification.permission === 'granted';
        setState(prev => ({ ...prev, permissionGranted: permission }));
      }
    };

    checkPermission();

    // Load persisted alerts from localStorage
    const savedAlerts = localStorage.getItem('aqua-ai-alerts');
    if (savedAlerts) {
      try {
        const alerts = JSON.parse(savedAlerts).map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
        }));
        const unreadCount = alerts.filter((alert: Alert) => !alert.isRead).length;
        setState(prev => ({ ...prev, alerts, unreadCount }));
      } catch (error) {
        console.error('Error loading saved alerts:', error);
      }
    }
  }, []);

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    if (state.alerts.length > 0) {
      localStorage.setItem('aqua-ai-alerts', JSON.stringify(state.alerts));
    }
  }, [state.alerts]);

  // Clean up old toasts
  useEffect(() => {
    const interval = setInterval(() => {
      setToasts(prev => prev.filter(toast => {
        const age = Date.now() - toast.timestamp.getTime();
        return age < toast.duration;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addAlert = useCallback((alertData: Omit<Alert, 'id' | 'timestamp' | 'isRead'>) => {
    const alert: Alert = {
      ...alertData,
      id: generateId(),
      timestamp: new Date(),
      isRead: false,
    };

    setState(prev => ({
      ...prev,
      alerts: [alert, ...prev.alerts].slice(0, 100), // Keep only latest 100 alerts
      unreadCount: prev.unreadCount + 1,
    }));

    // Show browser notification if permission granted
    if (state.permissionGranted && document.hidden) {
      showBrowserNotification(alert);
    }

    // Show toast for immediate feedback
    const toastType = getSeverityColor(alert.severity);
    showToast(alert.title, toastType);

    // Play notification sound for critical alerts
    if (alert.severity === 'critical' || alert.severity === 'emergency') {
      playNotificationSound();
    }
  }, [state.permissionGranted]);

  const markAsRead = useCallback((alertId: string) => {
    setState(prev => {
      const updatedAlerts = prev.alerts.map(alert =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      );
      const unreadCount = updatedAlerts.filter(alert => !alert.isRead).length;
      return { ...prev, alerts: updatedAlerts, unreadCount };
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert => ({ ...alert, isRead: true })),
      unreadCount: 0,
    }));
  }, []);

  const removeAlert = useCallback((alertId: string) => {
    setState(prev => {
      const updatedAlerts = prev.alerts.filter(alert => alert.id !== alertId);
      const unreadCount = updatedAlerts.filter(alert => !alert.isRead).length;
      return { ...prev, alerts: updatedAlerts, unreadCount };
    });
  }, []);

  const clearAll = useCallback(() => {
    setState(prev => ({ ...prev, alerts: [], unreadCount: 0 }));
    localStorage.removeItem('aqua-ai-alerts');
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setState(prev => ({ ...prev, permissionGranted: granted }));
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info', duration = 5000) => {
    const toast = {
      id: generateId(),
      message,
      type,
      duration,
      timestamp: new Date(),
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, duration);
  }, []);

  const subscribeToWebSocket = useCallback(() => {
    if (websocket?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Disable WebSocket in production for now to prevent connection errors
    if (process.env.NODE_ENV === 'development') {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
      const ws = new WebSocket(`${wsUrl}/notifications`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({ ...prev, isConnected: true }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ALERT') {
            addAlert({
              title: data.data.title,
              message: data.data.message,
              type: data.data.type || 'system',
              severity: data.data.severity || 'info',
              location: data.data.location,
              coordinates: data.data.coordinates,
              actions: data.data.actions,
              metadata: data.data.metadata,
            });
          } else if (data.type === 'REAL_TIME_DATA') {
            // Handle real-time data updates
            console.log('Real-time data update:', data.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setState(prev => ({ ...prev, isConnected: false }));
        
        // Attempt to reconnect after 5 seconds in development only
        setTimeout(() => {
          if (websocket?.readyState !== WebSocket.OPEN && process.env.NODE_ENV === 'development') {
            subscribeToWebSocket();
          }
        }, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, isConnected: false }));
      };
      
      setWebsocket(ws);
    } else {
      // In production, mark as disconnected without WebSocket
      setState(prev => ({ ...prev, isConnected: false }));
      return;
    }
  }, [websocket, addAlert]);

  const unsubscribeFromWebSocket = useCallback(() => {
    if (websocket) {
      websocket.close();
      setWebsocket(null);
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, [websocket]);

  // Auto-connect to WebSocket on mount
  useEffect(() => {
    subscribeToWebSocket();

    return () => {
      unsubscribeFromWebSocket();
    };
  }, []);

  const value: NotificationContextValue = {
    ...state,
    addAlert,
    markAsRead,
    markAllAsRead,
    removeAlert,
    clearAll,
    requestPermission,
    showToast,
    subscribeToWebSocket,
    unsubscribeFromWebSocket,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </NotificationContext.Provider>
  );
}

// Helper functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getSeverityColor(severity: AlertSeverity): 'success' | 'error' | 'warning' | 'info' {
  switch (severity) {
    case 'emergency':
    case 'critical':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'info';
  }
}

function showBrowserNotification(alert: Alert): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification(alert.title, {
    body: alert.message,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: alert.id,
    requireInteraction: alert.severity === 'critical' || alert.severity === 'emergency',
    data: {
      alertId: alert.id,
      location: alert.location,
      coordinates: alert.coordinates,
    },
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
    
    // Navigate to relevant page if location is provided
    if (alert.coordinates) {
      window.location.href = `/map?lat=${alert.coordinates[0]}&lng=${alert.coordinates[1]}`;
    }
  };

  // Auto-close after 10 seconds for non-critical alerts
  if (alert.severity !== 'critical' && alert.severity !== 'emergency') {
    setTimeout(() => notification.close(), 10000);
  }
}

function playNotificationSound(): void {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.warn('Could not play notification sound:', error);
    });
  } catch (error) {
    console.warn('Could not create notification sound:', error);
  }
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    timestamp: Date;
  }>;
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            marginBottom: '10px',
            padding: '12px 16px',
            borderRadius: '4px',
            color: 'white',
            backgroundColor: getToastColor(toast.type),
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'auto',
            cursor: 'pointer',
            maxWidth: '300px',
            wordWrap: 'break-word',
            animation: 'slideInRight 0.3s ease-out',
          }}
          onClick={() => onRemove(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function getToastColor(type: 'success' | 'error' | 'warning' | 'info'): string {
  switch (type) {
    case 'success':
      return '#4caf50';
    case 'error':
      return '#f44336';
    case 'warning':
      return '#ff9800';
    case 'info':
      return '#2196f3';
    default:
      return '#2196f3';
  }
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
