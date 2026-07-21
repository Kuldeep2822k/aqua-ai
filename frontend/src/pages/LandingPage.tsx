import { useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CircleDot,
  Database,
  Droplets,
  Gauge,
  Map,
  MapPin,
  Menu,
  ShieldCheck,
  TrendingUp,
  Waves,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onViewMap: () => void;
}

const signals = [
  ['01', 'Live Risk Map', 'Spatial view of monitored water bodies', '500+'],
  ['02', 'Alert Triage', 'Critical parameter breaches surfaced fast', '24/7'],
  ['03', 'Quality Trends', 'Longitudinal signal from raw readings', '8 params'],
  [
    '04',
    'Public Data Layer',
    'Government and field data in one console',
    'India',
  ],
];

const metrics = [
  { label: 'Water bodies tracked', value: '500+' },
  { label: 'Quality parameters', value: '8' },
  { label: 'Risk states modeled', value: '4' },
  { label: 'Operational views', value: '5' },
];

const fieldSnapshot = [
  { label: 'High-risk sites', value: '37', tone: 'text-red-200' },
  { label: 'Warning sites', value: '126', tone: 'text-amber-200' },
  { label: 'Stable sites', value: '342', tone: 'text-emerald-200' },
];

const riskBands = [
  {
    label: 'Critical',
    value: '7%',
    width: 'w-[7%]',
    color: 'bg-red-400',
    description: 'Immediate breach or clustered parameter failure',
  },
  {
    label: 'Warning',
    value: '25%',
    width: 'w-[25%]',
    color: 'bg-amber-300',
    description: 'Elevated trend, drift, or repeated threshold pressure',
  },
  {
    label: 'Stable',
    value: '68%',
    width: 'w-[68%]',
    color: 'bg-emerald-300',
    description: 'Within monitored range with normal trend movement',
  },
];

const parameters = [
  { label: 'pH', value: '6.5-8.5', icon: Gauge },
  { label: 'Dissolved Oxygen', value: '> 5 mg/L', icon: Activity },
  { label: 'BOD', value: '< 3 mg/L', icon: Droplets },
  { label: 'Turbidity', value: '< 5 NTU', icon: TrendingUp },
  { label: 'Nitrates', value: '< 10 mg/L', icon: BarChart3 },
  { label: 'Fecal Coliform', value: 'flagged', icon: AlertTriangle },
];

const workflow = [
  {
    title: 'Ingest',
    description: 'Pull public water quality readings and field metadata.',
    icon: Database,
  },
  {
    title: 'Score',
    description: 'Compare parameters against thresholds and trend movement.',
    icon: ShieldCheck,
  },
  {
    title: 'Locate',
    description: 'Bind every signal to map context for operational response.',
    icon: MapPin,
  },
  {
    title: 'Act',
    description: 'Route the team to alerts, analytics, and exportable reports.',
    icon: ArrowRight,
  },
];

function ImmersiveWaterField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || navigator.userAgent.toLowerCase().includes('jsdom')) {
      return undefined;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    const ctx = context;
    let animationId = 0;
    let frame = 0;
    let cssWidth = 1;
    let cssHeight = 1;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const particles = Array.from({ length: 110 }, (_, index) => ({
      angle: (index / 110) * Math.PI * 2,
      radius: 0.18 + ((index * 37) % 100) / 260,
      speed: 0.002 + ((index * 11) % 9) * 0.00035,
      size: 0.6 + ((index * 17) % 13) / 10,
      hue:
        index % 5 === 0 ? '#c07878' : index % 3 === 0 ? '#68e1fd' : '#ffffff',
    }));

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      cssWidth = Math.max(1, width);
      cssHeight = Math.max(1, height);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
      canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
    };

    const drawPortal = (width: number, height: number) => {
      const cx = width * 0.58;
      const cy = height * 0.47;
      const base = Math.min(width, height) * 0.24;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(frame * 0.002);

      for (let i = 0; i < 7; i += 1) {
        const radius = base + i * 18 + Math.sin(frame * 0.02 + i) * 5;
        const alpha = 0.18 - i * 0.018;
        ctx.strokeStyle = `rgba(104, 225, 253, ${Math.max(alpha, 0.035)})`;
        ctx.lineWidth = i === 0 ? 1.4 : 0.7;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.12, radius * 0.62, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 16; i += 1) {
        const a = (i / 16) * Math.PI * 2 + frame * 0.0012;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * base * 0.28, Math.sin(a) * base * 0.15);
        ctx.lineTo(Math.cos(a) * base * 1.2, Math.sin(a) * base * 0.68);
        ctx.stroke();
      }

      const core = ctx.createRadialGradient(
        0,
        0,
        base * 0.04,
        0,
        0,
        base * 0.9
      );
      core.addColorStop(0, 'rgba(255,255,255,0.72)');
      core.addColorStop(0.24, 'rgba(104,225,253,0.28)');
      core.addColorStop(0.58, 'rgba(48,72,144,0.13)');
      core.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(0, 0, base * 1.2, base * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = cssWidth;
      const height = cssHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const wash = ctx.createRadialGradient(
        width * 0.58,
        height * 0.42,
        10,
        width * 0.58,
        height * 0.42,
        width * 0.62
      );
      wash.addColorStop(0, 'rgba(48,72,144,0.38)');
      wash.addColorStop(0.45, 'rgba(20,50,62,0.18)');
      wash.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';
      particles.forEach((particle, index) => {
        const angle = particle.angle + frame * particle.speed;
        const depth = Math.sin(frame * 0.006 + index) * 0.035;
        const x =
          width * 0.58 +
          Math.cos(angle) * width * (particle.radius + depth) * 0.72;
        const y =
          height * 0.47 +
          Math.sin(angle * 1.7) * height * (particle.radius + depth) * 0.42;
        ctx.globalAlpha = 0.28 + Math.sin(frame * 0.018 + index) * 0.14;
        ctx.fillStyle = particle.hue;
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      drawPortal(width, height);
      ctx.globalCompositeOperation = 'source-over';

      if (!motionQuery.matches) {
        frame += 1;
        animationId = window.requestAnimationFrame(draw);
      }
    };

    const redraw = () => {
      window.cancelAnimationFrame(animationId);
      resize();
      draw();
    };

    redraw();
    window.addEventListener('resize', redraw);
    motionQuery.addEventListener('change', redraw);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', redraw);
      motionQuery.removeEventListener('change', redraw);
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
    <main className="min-h-screen bg-black text-white">
      <section className="relative min-h-screen overflow-hidden">
        <ImmersiveWaterField />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.58)_42%,rgba(0,0,0,0.2)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />

        <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-8">
          <button
            type="button"
            onClick={onEnterApp}
            className="group flex items-center gap-3"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/[0.03] text-white transition group-hover:border-white/45">
              <Waves className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.24em]">
              Aqua-AI
            </span>
          </button>

          <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.22em] text-white/62 md:flex">
            <a href="#signals" className="transition hover:text-white">
              Signals
            </a>
            <a href="#coverage" className="transition hover:text-white">
              Coverage
            </a>
            <a href="#parameters" className="transition hover:text-white">
              Parameters
            </a>
            <a href="#system" className="transition hover:text-white">
              System
            </a>
            <button
              type="button"
              onClick={onEnterApp}
              className="rounded-full border border-white/20 px-4 py-2 text-white transition hover:border-white hover:bg-white hover:text-black"
            >
              Console
            </button>
          </nav>

          <button
            type="button"
            onClick={onEnterApp}
            aria-label="Open navigation"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/[0.03] md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </header>

        <div className="relative z-10 grid min-h-[calc(100vh-78px)] gap-10 px-5 pb-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="flex min-h-[70vh] min-w-0 flex-col justify-between">
            <div className="mt-10 max-w-6xl animate-rise-in md:mt-16">
              <p className="mb-5 max-w-2xl text-sm uppercase tracking-[0.28em] text-white/54">
                Environmental intelligence / water risk / India
              </p>
              <h1 className="max-w-6xl text-[clamp(4.75rem,13.2vw,13rem)] font-semibold uppercase leading-[0.76] tracking-normal">
                Water
                <span className="block text-white/18">Signals</span>
              </h1>
            </div>

            <div className="grid gap-8 md:grid-cols-[0.82fr_1.18fr] md:items-end">
              <div className="max-w-xl animate-rise-in-delayed">
                <p className="text-xl leading-8 text-white/75">
                  Aqua-AI turns readings, thresholds, locations, and alerts into
                  a command-grade monitoring surface for environmental response.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={onEnterApp}
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-cyan-200"
                  >
                    Enter Console
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </button>
                  <button
                    type="button"
                    onClick={onViewMap}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white backdrop-blur transition hover:border-white/55"
                  >
                    <Map className="h-4 w-4" />
                    Live Map
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="border-t border-white/18 py-4 text-left md:text-right"
                  >
                    <p className="text-5xl font-semibold">{metric.value}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="min-w-0 animate-rise-in-delayed border border-white/12 bg-black/42 p-5 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                Today / field state
              </p>
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
            </div>
            <div className="space-y-5">
              {fieldSnapshot.map((item) => (
                <div
                  key={item.label}
                  className="flex items-end justify-between border-b border-white/10 pb-4"
                >
                  <span className="text-sm text-white/58">{item.label}</span>
                  <span className={`text-4xl font-semibold ${item.tone}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/38">
                Risk mix
              </p>
              <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
                {riskBands.map((band) => (
                  <span
                    key={band.label}
                    className={`${band.width} ${band.color}`}
                  />
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {riskBands.map((band) => (
                  <div
                    key={band.label}
                    className="grid grid-cols-[5rem_1fr] gap-4"
                  >
                    <span className="text-sm font-semibold text-white">
                      {band.value}
                    </span>
                    <span className="text-sm text-white/54">
                      {band.label}: {band.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section
        id="signals"
        className="border-y border-white/10 bg-black px-5 py-12 md:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/42">
                Signal index
              </p>
              <h2 className="mt-3 text-4xl font-semibold uppercase tracking-normal md:text-6xl">
                Operational layers
              </h2>
            </div>
            <CircleDot className="hidden h-8 w-8 text-white/35 md:block" />
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {signals.map(([number, title, description, value]) => (
              <button
                key={number}
                type="button"
                onClick={title === 'Live Risk Map' ? onViewMap : onEnterApp}
                className="group grid w-full grid-cols-[3.5rem_1fr] items-center gap-4 py-7 text-left transition hover:bg-white/[0.035] md:grid-cols-[6rem_1fr_1fr_auto] lg:grid-cols-[6rem_1fr_1fr_7rem_auto]"
              >
                <span className="text-xs uppercase tracking-[0.22em] text-white/35">
                  {number}
                </span>
                <span className="text-3xl font-semibold uppercase leading-none text-white transition group-hover:text-transparent group-hover:[-webkit-text-stroke:1px_white] md:text-6xl">
                  {title}
                </span>
                <span className="hidden text-sm leading-6 text-white/50 md:block">
                  {description}
                </span>
                <span className="hidden text-right text-sm font-semibold uppercase tracking-[0.18em] text-white/42 lg:block">
                  {value}
                </span>
                <ArrowRight className="hidden h-5 w-5 text-white/45 transition group-hover:translate-x-1 group-hover:text-white md:block" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section
        id="coverage"
        className="border-b border-white/10 bg-black px-5 py-16 md:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/42">
              Monitoring coverage
            </p>
            <h2 className="mt-4 text-4xl font-semibold uppercase leading-none md:text-7xl">
              Built around the signals that make water unsafe.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/24 hover:bg-white/[0.055]"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-white/14 text-cyan-100">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs uppercase tracking-[0.22em] text-white/32">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold uppercase">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/56">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="parameters"
        className="border-b border-white/10 bg-black px-5 py-16 md:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/42">
                Parameter intelligence
              </p>
              <h2 className="mt-3 text-4xl font-semibold uppercase tracking-normal md:text-6xl">
                What gets measured
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-white/54">
              The landing page now surfaces the actual monitoring story: what is
              tracked, what crosses threshold, and how a public data layer
              becomes an operational risk console.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parameters.map((parameter) => {
              const Icon = parameter.icon;
              return (
                <div
                  key={parameter.label}
                  className="group flex min-h-32 items-center justify-between border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-200/45 hover:bg-cyan-200/[0.06]"
                >
                  <div>
                    <p className="text-2xl font-semibold uppercase">
                      {parameter.label}
                    </p>
                    <p className="mt-2 text-sm uppercase tracking-[0.18em] text-white/42">
                      {parameter.value}
                    </p>
                  </div>
                  <Icon className="h-7 w-7 text-white/35 transition group-hover:text-cyan-100" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="system" className="bg-black px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/42">
              System intent
            </p>
            <h2 className="mt-4 text-4xl font-semibold uppercase leading-none md:text-7xl">
              Less dashboard. More command field.
            </h2>
          </div>
          <div className="space-y-8 text-lg leading-8 text-white/62">
            <p>
              This direction keeps the interface quiet and lets data, geography,
              and motion carry the experience. The landing page acts as a
              black-stage entry point; the app shell becomes the first layer of
              the operational console.
            </p>
            <button
              type="button"
              onClick={onEnterApp}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:border-white hover:bg-white hover:text-black"
            >
              Continue to Aqua-AI
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
