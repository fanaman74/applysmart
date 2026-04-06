import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Upload,
  FileText,
  Sparkles,
  Target,
  PenLine,
  SearchX,
  FilePen,
  Building2,
  MessageSquare,
  Users,
  Clock,
  Zap,
  ChevronDown,
  Check,
  Search,
  MapPin,
  Briefcase,
  BarChart3,
  Lock,
  ArrowRight,
  Star,
} from 'lucide-react'
import { cn } from '../lib/cn'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeUp}
      className={cn('mx-auto max-w-6xl px-4 sm:px-6', className)}
    >
      {children}
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const stats = [
  { icon: Search, value: '850K+', label: 'Jobs Scanned' },
  { icon: BarChart3, value: '7', label: 'AI Analyses' },
  { icon: Users, value: '12K+', label: 'Job Seekers' },
  { icon: Clock, value: '<30s', label: 'Average Time' },
]

const steps = [
  { icon: Upload, num: '01', title: 'Upload Your CV', description: 'Drop in your CV — PDF or DOCX. We extract your full profile automatically.' },
  { icon: FileText, num: '02', title: 'Paste Job Description', description: 'Copy the listing straight from any careers page.' },
  { icon: Sparkles, num: '03', title: 'Get 7 AI Analyses', description: 'Match score, tailored CV, cover letter, interview prep and more — instantly.' },
]

const features = [
  { icon: Target, title: 'Match Score', tag: 'Scoring', description: 'See exactly how well your profile fits the role with a breakdown across 6 dimensions.' },
  { icon: PenLine, title: 'Cover Letter', tag: 'Writing', description: 'A personalised cover letter that mirrors the language of the job description.' },
  { icon: SearchX, title: 'Gap Analysis', tag: 'Insights', description: 'Identify missing skills and get an actionable plan to close the gaps.' },
  { icon: FilePen, title: 'Tailored CV', tag: 'Writing', description: 'Your CV restructured and rephrased to match exactly what the employer wants.' },
  { icon: Building2, title: 'Company Insights', tag: 'Research', description: 'Culture, recent news, interview tips, and red flags — all from public sources.' },
  { icon: MessageSquare, title: 'Interview Prep', tag: 'Coaching', description: 'Likely questions with strong STAR answers drawn from the job description.' },
  { icon: Users, title: 'Networking Messages', tag: 'Outreach', description: 'LinkedIn and email outreach templates ready to personalise and send.' },
]

const faqs = [
  { question: 'Is my data secure?', answer: 'Absolutely. Your CV and job descriptions are processed securely and never shared with third parties. We use encryption at rest and in transit, and you can delete your data at any time.' },
  { question: 'What file formats do you accept?', answer: 'You can upload your CV as a PDF or DOCX. For job descriptions, paste the text directly.' },
  { question: 'How accurate is the match score?', answer: 'The match score analyses your skills, experience, and qualifications against the job requirements. It provides a percentage with a detailed breakdown so you can see exactly where you stand.' },
  { question: 'Can I use this for multiple applications?', answer: 'Yes. Each analysis is independent, so you can run as many as your plan allows. The tracker keeps all your applications organised.' },
  { question: 'Do I need to create an account?', answer: 'A free account gives you 3 analyses per month. Sign up takes less than 30 seconds.' },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left text-text hover:text-accent transition-colors"
      >
        <span className="text-base font-medium">{question}</span>
        <ChevronDown size={18} className={cn('shrink-0 ml-4 transition-transform text-text-muted', open && 'rotate-180')} />
      </button>
      <div className={cn('overflow-hidden transition-all duration-300', open ? 'max-h-60 pb-5' : 'max-h-0')}>
        <p className="text-sm leading-relaxed text-text-secondary">{answer}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Hero search bar (JobPortal-inspired)                               */
/* ------------------------------------------------------------------ */

type HeroTab = 'job' | 'cv'

function HeroSearch() {
  const [tab, setTab] = useState<HeroTab>('job')

  return (
    <div className="mt-10 mx-auto max-w-3xl">
      {/* Tabs */}
      <div className="inline-flex rounded-xl bg-white/10 backdrop-blur-sm p-1 mb-4">
        <button
          onClick={() => setTab('job')}
          className={cn(
            'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
            tab === 'job'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-white/80 hover:text-white'
          )}
        >
          Find a Job
        </button>
        <button
          onClick={() => setTab('cv')}
          className={cn(
            'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
            tab === 'cv'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-white/80 hover:text-white'
          )}
        >
          Analyse My CV
        </button>
      </div>

      {/* Search bar */}
      {tab === 'job' ? (
        <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-2xl">
          <div className="flex flex-1 items-center gap-3 px-4 py-2">
            <Briefcase size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Job title, skill, or keyword…"
              className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm outline-none"
            />
          </div>
          <div className="hidden sm:block w-px bg-slate-100 self-stretch my-2" />
          <div className="flex flex-1 items-center gap-3 px-4 py-2">
            <MapPin size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="City, country, or Remote…"
              className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm outline-none"
            />
          </div>
          <Link
            to="/job-search"
            className="shrink-0 flex items-center gap-2 bg-accent hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <Search size={16} /> Search
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-2xl">
          <div className="flex flex-1 items-center gap-3 px-4 py-3">
            <Upload size={18} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-sm">Upload your CV and let AI find the right roles…</span>
          </div>
          <Link
            to="/job-search"
            className="shrink-0 flex items-center gap-2 bg-accent hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <Sparkles size={16} /> Get Started
          </Link>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Feature card (Dribbble-inspired)                                   */
/* ------------------------------------------------------------------ */

const TAG_COLOURS: Record<string, string> = {
  Scoring: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Writing: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Insights: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  Research: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  Coaching: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  Outreach: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
}

/* ------------------------------------------------------------------ */
/*  Landing page                                                       */
/* ------------------------------------------------------------------ */

export default function Landing() {
  return (
    <div className="bg-base">

      {/* ============================================================ */}
      {/* HERO — JobPortal full-bleed with gradient overlay            */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, #0a1628 0%, #0f1e3a 40%, #1a1a2e 70%, #16213e 100%)',
          }}
        />
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', transform: 'translate(-20%, 20%)' }} />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pt-24 pb-28 sm:pt-32 sm:pb-36 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-400 mb-6">
              <Zap size={12} /> AI-powered job matching — free to start
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Your Next Role<br />
              <span className="text-accent">Is Waiting</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed">
              Upload your CV, paste a job description, and get 7 AI-powered analyses in seconds.
              Match scores, tailored CVs, cover letters, and interview prep — all in one click.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <HeroSearch />
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400"
          >
            <span className="flex items-center gap-1.5"><Lock size={14} className="text-amber-400" /> Your data stays yours</span>
            <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-400" /> Free to start</span>
            <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-amber-400" /> No credit card needed</span>
          </motion.div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* STATS BAR — JobPortal icon strip                             */}
      {/* ============================================================ */}
      <div className="border-y border-border bg-card/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
                  <Icon size={22} className="text-accent" />
                </div>
                <p className="text-2xl font-bold text-text font-mono">{value}</p>
                <p className="text-xs text-text-muted tracking-wide uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* HOW IT WORKS                                                 */}
      {/* ============================================================ */}
      <Section className="py-24 sm:py-32">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">Simple Process</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text">How it works</h2>
          <p className="mt-3 text-text-secondary max-w-xl mx-auto">From CV to application-ready toolkit in under a minute.</p>
        </div>

        <div className="relative grid gap-8 sm:grid-cols-3">
          {/* Connector line */}
          <div className="absolute top-10 left-[22%] right-[22%] hidden sm:block h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

          {steps.map((step) => (
            <div key={step.title} className="relative flex flex-col items-center text-center group">
              <div className="relative z-10 w-20 h-20 rounded-2xl border border-border bg-card flex items-center justify-center group-hover:border-accent/50 transition-colors">
                <step.icon size={28} className="text-accent" />
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                <span className="inline-flex items-center justify-center h-6 w-10 rounded-full bg-accent text-[10px] font-bold text-white">
                  {step.num}
                </span>
              </div>
              <h3 className="mt-6 text-base font-semibold text-text">{step.title}</h3>
              <p className="mt-1.5 text-sm text-text-secondary max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/* FEATURES — Dribbble-style job cards                          */}
      {/* ============================================================ */}
      <div className="bg-card/30 py-24 sm:py-32 border-y border-border">
        <Section>
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">What You Get</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text">Seven analyses, one click</h2>
            <p className="mt-3 text-text-secondary max-w-2xl mx-auto">
              No generic templates. Every output is tailored to the specific role and your unique CV.
            </p>
          </div>

          {/* Dribbble-style grid: sidebar promo + card grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar promo (Dribbble "Dribbble Talent" card) */}
            <div className="lg:w-56 shrink-0">
              <div className="rounded-2xl border border-accent/30 bg-gradient-to-b from-accent/20 to-accent/5 p-6 sticky top-24">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 mb-4">
                  <Sparkles size={20} className="text-accent" />
                </div>
                <h3 className="font-semibold text-text text-sm leading-snug mb-2">
                  AI That Understands Your Career
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Works for any profession — not just tech. From EU institutions to creative roles.
                </p>
                <Link
                  to="/job-search"
                  className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  Try it free <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Feature cards — Dribbble-style */}
            <div className="flex-1 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border bg-card p-5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all cursor-default"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-border group-hover:border-accent/30 transition-colors">
                      <f.icon size={18} className="text-accent" />
                    </div>
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                      TAG_COLOURS[f.tag] ?? 'bg-surface border-border text-text-muted'
                    )}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-text">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">{f.description}</p>
                  {/* Pill row (Dribbble-style location/remote pills) */}
                  <div className="mt-3 flex gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] text-text-muted">
                      <Zap size={9} className="text-accent" /> Instant
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] text-text-muted">
                      <Check size={9} className="text-emerald-400" /> Free tier
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* ============================================================ */}
      {/* PRICING                                                      */}
      {/* ============================================================ */}
      <Section className="py-24 sm:py-32">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text">Simple, transparent pricing</h2>
          <p className="mt-3 text-text-secondary">Start free. Upgrade when you need more firepower.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {/* Free */}
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
            <h3 className="text-base font-semibold text-text-secondary uppercase tracking-wide text-xs mb-2">Free</h3>
            <p className="text-4xl font-bold text-text">$0<span className="text-base font-normal text-text-muted">/month</span></p>
            <p className="mt-3 text-sm text-text-secondary">Everything you need to get started.</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-text-secondary">
              {['3 analyses per month', 'All 7 analysis modules', 'Application tracker', 'CV upload & extract', 'PDF & DOCX export'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <Check size={15} className="text-accent shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="mt-8 block rounded-xl bg-accent hover:bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border border-accent/50 bg-gradient-to-b from-accent/10 to-card p-8 flex flex-col overflow-hidden">
            <div className="absolute top-5 right-5 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-white">
              Coming Soon
            </div>
            <h3 className="text-base font-semibold text-text-secondary uppercase tracking-wide text-xs mb-2">Pro</h3>
            <p className="text-4xl font-bold text-text">$12<span className="text-base font-normal text-text-muted">/month</span></p>
            <p className="mt-3 text-sm text-text-secondary">For active job seekers on the hunt.</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-text-secondary">
              {['100 analyses per month', 'Priority AI processing', 'All export formats', 'AI Job Search agents', 'Everything in Free'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <Check size={15} className="text-accent shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <button disabled className="mt-8 block rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-text-muted cursor-not-allowed w-full">
              Coming Soon
            </button>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/* FAQ                                                          */}
      {/* ============================================================ */}
      <div className="bg-card/30 border-t border-border py-24 sm:py-32">
        <Section>
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text">Frequently asked questions</h2>
          </div>
          <div className="mx-auto max-w-2xl">
            {faqs.map((faq) => <FAQItem key={faq.question} {...faq} />)}
          </div>
        </Section>
      </div>

      {/* ============================================================ */}
      {/* FINAL CTA — JobPortal-inspired full-bleed strip              */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{ background: 'linear-gradient(135deg, #0f1729 0%, #1e293b 50%, #0f1729 100%)' }}
        />
        <div className="absolute inset-0 z-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #d97706 0%, transparent 60%)' }} />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-24 sm:py-32 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to land your next role?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-400 text-base">
              Join thousands of job seekers who stopped guessing and started landing interviews.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-amber-600 px-7 py-3.5 text-base font-bold text-white transition-colors shadow-lg shadow-accent/25"
              >
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link
                to="/job-search"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 hover:border-white/40 px-7 py-3.5 text-base font-semibold text-white/80 hover:text-white transition-colors"
              >
                <Search size={16} /> Search Jobs
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="h-8" />
    </div>
  )
}
