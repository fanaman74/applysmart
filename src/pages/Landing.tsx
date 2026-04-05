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
  Ban,
  HelpCircle,
  FileQuestion,
  BarChart3,
  Lock,
} from 'lucide-react'
import { cn } from '../lib/cn'

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

function Section({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
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
/*  Pain points                                                        */
/* ------------------------------------------------------------------ */

const painPoints = [
  { icon: Clock, text: 'Tailoring every application takes hours' },
  { icon: Ban, text: 'Generic cover letters get ignored' },
  { icon: HelpCircle, text: 'No idea if you actually match the job' },
  { icon: FileQuestion, text: 'Interview prep feels like guesswork' },
  { icon: Users, text: 'Networking messages fall flat' },
]

/* ------------------------------------------------------------------ */
/*  Steps                                                              */
/* ------------------------------------------------------------------ */

const steps = [
  { icon: Upload, title: 'Upload your CV', description: 'Drop in your existing CV in any common format.' },
  { icon: FileText, title: 'Paste the job description', description: 'Copy the listing straight from the careers page.' },
  { icon: Sparkles, title: 'Get 7 AI analyses instantly', description: 'Receive a full application toolkit in seconds.' },
]

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */

const features = [
  { icon: Target, title: 'Match Score', description: 'See exactly how well your profile fits the role, with a detailed breakdown.' },
  { icon: PenLine, title: 'Cover Letter', description: 'A tailored cover letter that highlights your most relevant experience.' },
  { icon: SearchX, title: 'Gap Analysis', description: 'Identify missing skills and get actionable advice on how to address them.' },
  { icon: FilePen, title: 'Tailored CV', description: 'Your CV restructured and rephrased to match what the employer wants.' },
  { icon: Building2, title: 'Company Insights', description: 'Key facts about the company, culture, and what to emphasise in your application.' },
  { icon: MessageSquare, title: 'Interview Prep', description: 'Likely questions and strong talking points drawn from the job description.' },
  { icon: Users, title: 'Networking Messages', description: 'Ready-to-send LinkedIn and email outreach templates for the role.' },
]

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */

const faqs = [
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. Your CV and job descriptions are processed securely and never shared with third parties. We use encryption at rest and in transit, and you can delete your data at any time.',
  },
  {
    question: 'What file formats do you accept?',
    answer:
      'You can upload your CV as a PDF, DOCX, or plain text file. For job descriptions, simply paste the text directly into the input field.',
  },
  {
    question: 'How accurate is the match score?',
    answer:
      'The match score analyses your skills, experience, and qualifications against the job requirements using advanced AI. It provides a percentage score with a detailed breakdown so you can see exactly where you stand.',
  },
  {
    question: 'Can I use this for multiple job applications?',
    answer:
      'Yes. Each analysis is independent, so you can run as many as your plan allows. The tracker keeps all your applications organised in one place.',
  },
  {
    question: 'Do I need to create an account?',
    answer:
      'A free account gives you 3 analyses per month. Sign up takes less than 30 seconds — just an email and password.',
  },
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
        <ChevronDown
          size={18}
          className={cn('shrink-0 ml-4 transition-transform text-text-muted', open && 'rotate-180')}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-60 pb-5' : 'max-h-0'
        )}
      >
        <p className="text-sm leading-relaxed text-text-secondary">{answer}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Landing page                                                       */
/* ------------------------------------------------------------------ */

export default function Landing() {
  return (
    <div className="bg-base">
      {/* ---- Hero ---- */}
      <Section className="pt-24 pb-20 sm:pt-32 sm:pb-28 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text">
          Apply <span className="text-accent">Smarter</span>, Not Harder
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary leading-relaxed">
          Upload your CV, paste a job description, and get AI-powered analysis in
          seconds. Seven tailored outputs — from match scores to interview prep — so
          every application counts.
        </p>

        <div className="mt-10">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-base hover:bg-accent-hover transition-colors"
          >
            Get Started Free
            <Sparkles size={18} />
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-text-muted">
          <span className="flex items-center gap-2">
            <Zap size={16} className="text-accent" /> Free to start
          </span>
          <span className="flex items-center gap-2">
            <BarChart3 size={16} className="text-accent" /> 7 AI analyses
          </span>
          <span className="flex items-center gap-2">
            <Lock size={16} className="text-accent" /> Your data stays yours
          </span>
        </div>
      </Section>

      {/* ---- Problem ---- */}
      <Section className="py-20 sm:py-28">
        <h2 className="text-center text-3xl sm:text-4xl font-bold text-text">
          Sound familiar?
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {painPoints.map((p) => (
            <div
              key={p.text}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <p.icon size={20} className="text-accent" />
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">{p.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- How it works ---- */}
      <Section className="py-20 sm:py-28">
        <h2 className="text-center text-3xl sm:text-4xl font-bold text-text">
          How it works
        </h2>
        <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
          {/* Connecting line (desktop only) */}
          <div className="absolute top-10 left-[16.67%] right-[16.67%] hidden sm:block">
            <div className="h-px w-full bg-border" />
          </div>

          {steps.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card">
                <step.icon size={28} className="text-accent" />
              </div>
              <span className="mt-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-base">
                {i + 1}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-text">{step.title}</h3>
              <p className="mt-1 max-w-xs text-sm text-text-secondary">{step.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- Features ---- */}
      <Section className="py-20 sm:py-28">
        <h2 className="text-center text-3xl sm:text-4xl font-bold text-text">
          Seven analyses, one click
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-text-secondary">
          Every analysis is tailored to the specific role. No generic templates, no
          guesswork.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <f.icon size={20} className="text-accent" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-text">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- Pricing ---- */}
      <Section className="py-20 sm:py-28">
        <h2 className="text-center text-3xl sm:text-4xl font-bold text-text">
          Simple pricing
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-text-secondary">
          Start for free. Upgrade when you need more.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:max-w-3xl lg:mx-auto">
          {/* Free */}
          <div className="rounded-xl border border-border bg-card p-8 flex flex-col">
            <h3 className="text-lg font-semibold text-text">Free</h3>
            <p className="mt-1 text-3xl font-bold text-text">
              $0<span className="text-base font-normal text-text-muted">/month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-text-secondary">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-accent shrink-0" /> 3 analyses per month
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-accent shrink-0" /> All 7 analysis modules
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-accent shrink-0" /> Application tracker
              </li>
            </ul>
            <Link
              to="/signup"
              className="mt-8 block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-medium text-base hover:bg-accent-hover transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-xl border border-accent/50 bg-card p-8 flex flex-col">
            <span className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-base">
              Coming Soon
            </span>
            <h3 className="text-lg font-semibold text-text">Pro</h3>
            <p className="mt-1 text-3xl font-bold text-text">
              $12<span className="text-base font-normal text-text-muted">/month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-text-secondary">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-accent shrink-0" /> 100 analyses per month
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-accent shrink-0" /> Priority processing
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-accent shrink-0" /> Export all formats
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-accent shrink-0" /> Everything in Free
              </li>
            </ul>
            <button
              disabled
              className="mt-8 block rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-text-muted cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </Section>

      {/* ---- FAQ ---- */}
      <Section className="py-20 sm:py-28">
        <h2 className="text-center text-3xl sm:text-4xl font-bold text-text">
          Frequently asked questions
        </h2>
        <div className="mx-auto mt-12 max-w-2xl">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} {...faq} />
          ))}
        </div>
      </Section>

      {/* ---- Final CTA ---- */}
      <Section className="py-20 sm:py-28 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-text">
          Ready to apply smarter?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-text-secondary">
          Join thousands of job seekers who stopped guessing and started landing
          interviews.
        </p>
        <div className="mt-8">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-base hover:bg-accent-hover transition-colors"
          >
            Get Started Free
            <Sparkles size={18} />
          </Link>
        </div>
      </Section>

      {/* Footer spacer */}
      <div className="h-16" />
    </div>
  )
}
