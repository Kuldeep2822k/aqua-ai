import { useEffect, useRef } from 'react';

type SceneCleanup = () => void;

export function SignalWebGLStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      navigator.userAgent.toLowerCase().includes('jsdom') ||
      !window.WebGLRenderingContext
    ) {
      return undefined;
    }

    let cleanup: SceneCleanup | undefined;
    let cancelled = false;

    void import('./SignalWebGLRuntime').then(({ mountSignalScene }) => {
      if (cancelled) {
        return;
      }
      cleanup = mountSignalScene(canvas);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
