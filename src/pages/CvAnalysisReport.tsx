import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, MapPin, Briefcase, Star, Award, BookOpen,
  Languages, Globe, Search, Target, TrendingUp, ChevronRight,
} from 'lucide-react'
import { useCvAnalysisStore } from '../stores/cvAnalysisStore'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'

const LEVEL_LABELS: Record<string, string> = {
  junior: 'Junior (<2 yrs)',
  mid: 'Mid-Level (2–5 yrs)',
  senior: 'Senior (5–10 yrs)',
  staff: 'Staff (10–20 yrs)',
  principal: 'Principal (20+ yrs)',
}

const REMOTE_LABELS: Record<string, string> = {
  remote: '🌍 Remote',
  hybrid: '🏢 Hybrid',
  onsite: '🏢 On-site',
  flexible: '🔄 Flexible',
  open: '✅ Open to all',
}

function Pill({ label, variant = 'default' }: { label: string; variant?: 'default' | 'accent' | 'muted' }) {
  const styles = {
    default: 'bg-surface border border-border text-text-secondary',
    accent: 'bg-accent/15 border border-accent/30 text-accent',
    muted: 'bg-surface text-text-muted border border-border',
  }
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className="text-accent shrink-0" />
        <h2 className="font-semibold text-text">{title}</h2>
      </div>
      {children}
    </Card>
  )
}

export default function CvAnalysisReport() {
  const navigate = useNavigate()
  const { profile, status } = useCvAnalysisStore()

  if (status !== 'complete' || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-text-secondary mb-4">No analysis available. Please analyse your CV first.</p>
        <Button onClick={() => navigate('/job-search')}>
          <ArrowLeft size={14} className="mr-2" /> Back to Job Search
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back + header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/job-search')}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to Job Search
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">{profile.name}</h1>
            <p className="text-accent font-medium mt-0.5">{profile.profession}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {profile.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase size={13} /> {profile.yearsExperience} years experience
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp size={13} /> {LEVEL_LABELS[profile.level] ?? profile.level}
              </span>
              <span>{REMOTE_LABELS[profile.remotePreference] ?? profile.remotePreference}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent border border-accent/30">
              {profile.yearsExperience}+ yrs
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Professional summary */}
        {profile.summary && (
          <Section icon={User} title="Professional Summary">
            <p className="text-sm text-text-secondary leading-relaxed">{profile.summary}</p>
          </Section>
        )}

        {/* Primary & Secondary Stack */}
        <Section icon={Star} title="Skills & Technologies">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Primary Skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.primaryStack.map((s) => (
                  <Pill key={s} label={s} variant="accent" />
                ))}
              </div>
            </div>
            {profile.secondaryStack.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Secondary Skills</p>
                <div className="flex flex-wrap gap-2">
                  {profile.secondaryStack.map((s) => (
                    <Pill key={s} label={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Target titles */}
        <Section icon={Target} title="Target Job Titles">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profile.targetTitles.map((t, i) => (
              <div key={t} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
                <span className="text-accent font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-text">{t}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Achievements */}
        <Section icon={Award} title="Key Achievements">
          <ul className="space-y-2">
            {profile.achievements.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <ChevronRight size={14} className="text-accent mt-0.5 shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </Section>

        {/* Industries */}
        <Section icon={Globe} title="Industries & Sectors">
          <div className="flex flex-wrap gap-2">
            {profile.industries.map((ind) => (
              <Pill key={ind} label={ind} variant="accent" />
            ))}
          </div>
        </Section>

        {/* Career history */}
        {profile.jobTitles.length > 0 && (
          <Section icon={Briefcase} title="Career Titles">
            <div className="space-y-1.5">
              {profile.jobTitles.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary py-1 border-b border-border last:border-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Education & Certifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profile.education && profile.education.length > 0 && (
            <Section icon={BookOpen} title="Education">
              <div className="space-y-3">
                {profile.education.map((e, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium text-text">{e.degree}</p>
                    <p className="text-text-muted text-xs mt-0.5">{e.school}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {profile.certifications && profile.certifications.length > 0 && (
            <Section icon={Award} title="Certifications">
              <div className="space-y-2">
                {profile.certifications.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    {c}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Languages */}
        {profile.languages && (profile.languages.native.length > 0 || profile.languages.working.length > 0) && (
          <Section icon={Languages} title="Languages">
            <div className="flex flex-wrap gap-4">
              {profile.languages.native.map((l) => (
                <div key={l} className="text-sm">
                  <span className="text-text font-medium">{l}</span>
                  <span className="text-text-muted text-xs ml-1.5">Native</span>
                </div>
              ))}
              {profile.languages.working.map((l) => (
                <div key={l} className="text-sm">
                  <span className="text-text font-medium">{l}</span>
                  <span className="text-text-muted text-xs ml-1.5">Working</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Search queries */}
        <Section icon={Search} title="Generated Search Queries">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Title Searches</p>
              <div className="space-y-1.5">
                {profile.searchQueries.titleQueries.map((q, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-sm font-mono text-text-secondary">
                    <Search size={11} className="text-accent shrink-0" />
                    {q}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Keyword Searches</p>
              <div className="flex flex-wrap gap-2">
                {profile.searchQueries.keywordQueries.map((q) => (
                  <Pill key={q} label={q} />
                ))}
              </div>
            </div>
            {profile.searchQueries.comboQueries.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Boolean Searches</p>
                <div className="space-y-1.5">
                  {profile.searchQueries.comboQueries.map((q, i) => (
                    <div key={i} className="rounded-lg bg-surface px-3 py-1.5 text-xs font-mono text-text-muted break-all">
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Footer action */}
        <div className="flex justify-center pt-2">
          <Button onClick={() => navigate('/job-search')}>
            <ArrowLeft size={14} className="mr-2" /> Back — Start Job Search
          </Button>
        </div>
      </div>
    </div>
  )
}
