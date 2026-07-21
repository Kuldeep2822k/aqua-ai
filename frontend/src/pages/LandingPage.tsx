import { useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Database,
  Droplets,
  Map,
  Radar,
  ShieldCheck,
  Waves,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onViewMap: () => void;
}

const impactStats = [
  { label: 'Water bodies tracked', value: '500+', icon: Droplets },
  { label: 'Quality parameters', value: '8', icon: Activity },
  { label: 'Risk tiers', value: '4', icon: AlertTriangle },
  { label: 'Operational views', value: '5', icon: Radar },
];

const workflow = [
  {
    title: 'Collect',
    description:
      'Bring government, weather, and monitoring data into one place.',
    icon: Database,
  },
  {
    title: 'Analyze',
    description: 'Compare readings against parameter thresholds and trends.',
    icon: BarChart3,
  },
  {
    title: 'Detect',
    description:
      'Surface high-risk locations before they disappear in raw data.',
    icon: Radar,
  },
  {
    title: 'Act',
    description:
      'Move from alert to map context, report export, and follow-up.',
    icon: ShieldCheck,
  },
];

function IntelligenceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    if (navigator.userAgent.toLowerCase().includes('jsdom')) {
      return undefined;
    }

    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext('2d');
    } catch {
      return undefined;
    }
    if (!context) {
      return undefined;
    }

    const ctx = context;
    const points = [
      { x: 0.33, y: 0.22, risk: '#22d3ee' },
      { x: 0.48, y: 0.31, risk: '#34d399' },
      { x: 0.58, y: 0.43, risk: '#f59e0b' },
      { x: 0.42, y: 0.53, risk: '#ef4444' },
      { x: 0.66, y: 0.62, risk: '#22d3ee' },
      { x: 0.53, y: 0.73, risk: '#34d399' },
      { x: 0.72, y: 0.32, risk: '#f59e0b' },
    ];
    let frame = 0;
    let animationId = 0;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#061827');
      gradient.addColorStop(0.48, '#083344');
      gradient.addColorStop(1, '#0f3f3e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = '#67e8f9';
      for (let i = 0; i < 8; i += 1) {
        ctx.beginPath();
        const y = height * (0.22 + i * 0.085);
        for (let x = 0; x <= width; x += 18) {
          const wave = Math.sin(x * 0.012 + frame * 0.02 + i) * 13;
          if (x === 0) {
            ctx.moveTo(x, y + wave);
          } else {
            ctx.lineTo(x, y + wave);
          }
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 0.36;
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#bae6fd';
      points.forEach((point, index) => {
        const next = points[(index + 1) % points.length];
        ctx.beginPath();
        ctx.moveTo(point.x * width, point.y * height);
        ctx.lineTo(next.x * width, next.y * height);
        ctx.stroke();
      });

      points.forEach((point, index) => {
        const x = point.x * width;
        const y = point.y * height;
        const pulse = 10 + Math.sin(frame * 0.045 + index) * 5;
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = point.risk;
        ctx.beginPath();
        ctx.arc(x, y, 20 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = point.risk;
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });

      frame += 1;
      animationId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
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

export function LandingPage({ onEnterApp, onViewMap }: LandingPageProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative min-h-[92vh]">
        <IntelligenceCanvas />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(45,212,191,0.28),transparent_32%),linear-gradient(90deg,rgba(2,6,23,0.92),rgba(2,6,23,0.58),rgba(2,6,23,0.24))]" />

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <button
            type="button"
            onClick={onEnterApp}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/15 text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.22)]">
              <Waves className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-normal">
              Aqua-AI
            </span>
          </button>
          <div className="hidden items-center gap-6 text-sm text-cyan-50/78 md:flex">
            <a href="#platform" className="hover:text-white">
              Platform
            </a>
            <a href="#workflow" className="hover:text-white">
              Workflow
            </a>
            <a href="#impact" className="hover:text-white">
              Impact
            </a>
          </div>
          <button
            type="button"
            onClick={onEnterApp}
            className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/16"
          >
            Open Dashboard
          </button>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
          <div className="max-w-3xl animate-rise-in">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-cyan-100/10 px-3 py-2 text-sm text-cyan-100 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.8)]" />
              Environmental intelligence for water risk
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-white md:text-7xl">
              Aqua-AI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
              AI-assisted water quality monitoring for identifying risk,
              understanding trends, and moving faster from raw readings to
              action.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onEnterApp}
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 font-semibold text-slate-950 shadow-[0_16px_50px_rgba(34,211,238,0.26)] transition hover:bg-cyan-200"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={onViewMap}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/16 bg-white/10 px-5 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/16"
              >
                <Map className="h-4 w-4" />
                View Live Map
              </button>
            </div>
          </div>

          <div className="animate-rise-in-delayed rounded-lg border border-white/12 bg-slate-950/45 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
            <div className="rounded-md border border-cyan-100/10 bg-slate-900/80 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-100/70">
                    National risk console
                  </p>
                  <p className="text-2xl font-semibold">
                    Live water intelligence
                  </p>
                </div>
                <span className="rounded-md bg-emerald-400/12 px-3 py-1 text-sm text-emerald-200">
                  Online
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {impactStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-md border border-white/10 bg-white/[0.06] p-4"
                    >
                      <Icon className="mb-4 h-5 w-5 text-cyan-200" />
                      <p className="text-3xl font-semibold">{stat.value}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-200" />
                  <div>
                    <p className="font-medium text-amber-50">Priority signal</p>
                    <p className="text-sm text-amber-100/78">
                      Detect elevated BOD, low DO, pH drift, and hotspot
                      clusters before they become routine reports.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="platform"
        className="relative border-y border-white/10 bg-slate-950 px-6 py-16"
      >
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <p className="text-sm font-semibold uppercase text-cyan-200">
              Platform
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">
              Built for teams that need signal, not noise.
            </h2>
          </div>
          <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
            {[
              'Map-first monitoring with risk-aware location markers.',
              'Alert triage for critical parameters and impacted sites.',
              'Analytics views for trends, coverage, and parameter violations.',
              'Dark-mode operational UI for long monitoring sessions.',
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-slate-50 px-6 py-20 text-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-cyan-700">
                Workflow
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal">
                From readings to response.
              </h2>
            </div>
            <button
              type="button"
              onClick={onEnterApp}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Explore the console
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="impact" className="bg-white px-6 py-16 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-lg border border-slate-200 bg-slate-950 p-8 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-200">
              Next step
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">
              Bring the same quality into the product workspace.
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              This landing foundation sets the visual direction. The dashboard,
              map, alerts, and analytics screens can now be redesigned against a
              stronger shell.
            </p>
          </div>
          <button
            type="button"
            onClick={onEnterApp}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  );
}
