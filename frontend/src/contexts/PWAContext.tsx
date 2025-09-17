import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  updateAvailable: boolean;
  lowBandwidthMode: boolean;
}

interface PWAContextValue extends PWAState {
  promptInstall: () => Promise<void>;
  dismissInstall: () => void;
  applyUpdate: () => void;
  dismissUpdate: () => void;
  setLowBandwidthMode: (enabled: boolean) => void;
}

const PWAContext = createContext<PWAContextValue | undefined>(undefined);

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false,
    updateAvailable: false,
    lowBandwidthMode: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      // Check if running in a test environment or if matchMedia is not available
      if (typeof window.matchMedia !== 'function') {
        setState(prev => ({ ...prev, isInstalled: false }));
        return;
      }
      
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      setState(prev => ({ ...prev, isInstalled }));
    };

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setDeferredPrompt(null);
    };

    // Handle online/offline status
    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }));

    // Set initial online/offline status
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      setState(prev => ({ ...prev, isOffline: !navigator.onLine }));
    }

    // Set initial low bandwidth mode from env or localStorage
    const lowBandwidthFromEnv = process.env.REACT_APP_LOW_BANDWIDTH_MODE === 'true';
    let lowBandwidthFromStorage = false;
    try {
      if (typeof localStorage !== 'undefined') {
        lowBandwidthFromStorage = localStorage.getItem('lowBandwidthMode') === 'true';
      }
    } catch (error) {
      // localStorage might not be available in test environment
    }
    const initialLowBandwidth = lowBandwidthFromEnv || lowBandwidthFromStorage;
    setState(prev => ({ ...prev, lowBandwidthMode: initialLowBandwidth }));

    checkInstalled();

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service Worker registration and update handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, updateAvailable: true }));
              }
            });
          }
        });
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setState(prev => ({ ...prev, updateAvailable: true }));
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const promptInstall = async (): Promise<void> => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setState(prev => ({ ...prev, isInstallable: false }));
    } catch (error) {
      console.error('Error prompting install:', error);
    }
  };

  const dismissInstall = (): void => {
    setDeferredPrompt(null);
    setState(prev => ({ ...prev, isInstallable: false }));
  };

  const applyUpdate = (): void => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const dismissUpdate = (): void => {
    setState(prev => ({ ...prev, updateAvailable: false }));
  };

  const setLowBandwidthMode = (enabled: boolean): void => {
    setState(prev => ({ ...prev, lowBandwidthMode: enabled }));
    
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lowBandwidthMode', enabled.toString());
      }
    } catch (error) {
      // localStorage might not be available in test environment
    }
    
    // Dispatch custom event for components to listen to
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lowBandwidthModeChange', { 
        detail: { enabled } 
      }));
    }
  };

  const value: PWAContextValue = {
    ...state,
    promptInstall,
    dismissInstall,
    applyUpdate,
    dismissUpdate,
    setLowBandwidthMode,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA(): PWAContextValue {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}
