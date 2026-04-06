import { useState } from 'react'
import { Settings2, RefreshCw, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Input } from '../common/Input'

interface SearchConfig {
  remoteOnly: boolean
  minSalary: string
  experienceLevel: string
  roleTypes: string
  avoidKeywords: string
  targetSources: string[]
  scoreThreshold: number
  includeNoSalary: boolean
  includeContract: boolean
  maxPostingAgeDays: number
}

interface SearchConfigFormProps {
  cvProfileId: string | null
  onStartSearch: (cvProfileId: string, overrides?: Record<string, unknown>) => void
  isSearching: boolean
}

const SOURCE_OPTIONS = [
  { id: 'linkedin',        label: 'LinkedIn Jobs',      group: 'General' },
  { id: 'indeed',          label: 'Indeed',             group: 'General' },
  { id: 'google-jobs',     label: 'Google Jobs',        group: 'General' },
  { id: 'glassdoor',       label: 'Glassdoor',          group: 'General' },
  { id: 'eu-careers',      label: 'EU Careers (EPSO)',  group: 'EU / International' },
  { id: 'eu-institutions', label: 'EU Agencies & NATO', group: 'EU / International' },
  { id: 'impactpool',      label: 'ImpactPool (UN/IO)', group: 'EU / International' },
  { id: 'eurobrussels',    label: 'EuroBrussels',       group: 'EU / International' },
  { id: 'euractiv-jobs',   label: 'Euractiv Jobs',      group: 'EU / International' },
  { id: 'weworkremotely',  label: 'We Work Remotely',   group: 'Remote' },
]

const DEFAULT_CONFIG: SearchConfig = {
  remoteOnly: false,
  minSalary: '',
  experienceLevel: 'senior',
  roleTypes: '',
  avoidKeywords: '',
  targetSources: ['linkedin', 'indeed', 'eu-careers', 'eu-institutions', 'google-jobs'],
  scoreThreshold: 65,
  includeNoSalary: true,
  includeContract: false,
  maxPostingAgeDays: 30,
}

export function SearchConfigForm({ cvProfileId, onStartSearch, isSearching }: SearchConfigFormProps) {
  const [config, setConfig] = useState<SearchConfig>(DEFAULT_CONFIG)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const session = useAuthStore((s) => s.session)

  async function autoGenerateConfig() {
    if (!cvProfileId || !session?.access_token) return
    setLoading(true)
    try {
      const res = await fetch('/api/job-search/generate-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ cvProfileId }),
      })
      if (res.ok) {
        const { config: suggested } = await res.json() as {
          config: {
            remoteOnly: boolean
            minSalary: number | null
            experienceLevel: string
            roleTypes: string[]
            avoidKeywords: string[]
            targetSources: string[]
            scoreThreshold: number
          }
        }
        setConfig({
          remoteOnly: suggested.remoteOnly,
          minSalary: suggested.minSalary ? String(suggested.minSalary) : '',
          experienceLevel: suggested.experienceLevel,
          roleTypes: suggested.roleTypes.join(', '),
          avoidKeywords: suggested.avoidKeywords.join(', '),
          targetSources: suggested.targetSources,
          scoreThreshold: suggested.scoreThreshold,
          includeNoSalary: false,
          includeContract: false,
          maxPostingAgeDays: 30,
        })
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false)
    }
  }

  function toggleSource(sourceId: string) {
    setConfig((c) => ({
      ...c,
      targetSources: c.targetSources.includes(sourceId)
        ? c.targetSources.filter((s) => s !== sourceId)
        : [...c.targetSources, sourceId],
    }))
  }

  function handleStart() {
    if (!cvProfileId) return
    const overrides: Record<string, unknown> = {
      remoteOnly: config.remoteOnly,
      targetSources: config.targetSources,
      scoreThreshold: config.scoreThreshold,
      includeNoSalary: config.includeNoSalary,
      includeContract: config.includeContract,
      maxPostingAgeDays: config.maxPostingAgeDays,
      experienceLevel: config.experienceLevel,
    }
    if (config.minSalary) overrides.minSalary = parseInt(config.minSalary, 10)
    if (config.roleTypes) overrides.roleTypes = config.roleTypes.split(',').map((s) => s.trim()).filter(Boolean)
    if (config.avoidKeywords) overrides.avoidKeywords = config.avoidKeywords.split(',').map((s) => s.trim()).filter(Boolean)
    onStartSearch(cvProfileId, overrides)
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-accent" />
          <h2 className="font-semibold text-text">Search Settings</h2>
        </div>
        <button
          onClick={autoGenerateConfig}
          disabled={!cvProfileId || loading}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Auto-generate from CV
        </button>
      </div>

      {/* Job sources */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">Job Sources</label>
        {(['General', 'EU / International', 'Remote'] as const).map((group) => {
          const groupSources = SOURCE_OPTIONS.filter((s) => s.group === group)
          return (
            <div key={group} className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1.5">{group}</p>
              <div className="flex flex-wrap gap-1.5">
                {groupSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      config.targetSources.includes(source.id)
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-surface text-text-secondary border border-border hover:border-accent/30'
                    }`}
                  >
                    {source.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Remote toggle */}
      <div className="flex items-center justify-between py-2 border-t border-border">
        <div>
          <p className="text-sm font-medium text-text">Remote Only</p>
          <p className="text-xs text-text-muted">Skip all onsite and hybrid roles</p>
        </div>
        <button
          onClick={() => setConfig((c) => ({ ...c, remoteOnly: !c.remoteOnly }))}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            config.remoteOnly ? 'bg-accent' : 'bg-surface border border-border'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              config.remoteOnly ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Min salary */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Minimum Salary (£ or $, leave blank for any)
        </label>
        <Input
          type="number"
          placeholder="e.g. 80000"
          value={config.minSalary}
          onChange={(e) => setConfig((c) => ({ ...c, minSalary: e.target.value }))}
        />
      </div>

      {/* Experience level */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">Experience Level</label>
        <select
          value={config.experienceLevel}
          onChange={(e) => setConfig((c) => ({ ...c, experienceLevel: e.target.value }))}
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
        >
          <option value="junior">Junior (&lt;2 years)</option>
          <option value="mid">Mid-level (2–5 years)</option>
          <option value="senior">Senior (5–10 years)</option>
          <option value="staff">Staff / Principal (10+ years)</option>
        </select>
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-text-muted hover:text-text transition-colors"
      >
        {showAdvanced ? '− Hide advanced options' : '+ Show advanced options'}
      </button>

      {showAdvanced && (
        <div className="space-y-3 pt-1 border-t border-border">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Target Role Types (comma-separated)
            </label>
            <Input
              placeholder="e.g. Software Engineer, Full Stack Engineer"
              value={config.roleTypes}
              onChange={(e) => setConfig((c) => ({ ...c, roleTypes: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Avoid Keywords (comma-separated)
            </label>
            <Input
              placeholder="e.g. security clearance, government"
              value={config.avoidKeywords}
              onChange={(e) => setConfig((c) => ({ ...c, avoidKeywords: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Min Score Threshold: {config.scoreThreshold}
            </label>
            <input
              type="range"
              min={40}
              max={90}
              step={5}
              value={config.scoreThreshold}
              onChange={(e) => setConfig((c) => ({ ...c, scoreThreshold: parseInt(e.target.value) }))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>40 (broad)</span>
              <span>90 (strict)</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Max Posting Age: {config.maxPostingAgeDays} days
            </label>
            <input
              type="range"
              min={7}
              max={60}
              step={7}
              value={config.maxPostingAgeDays}
              onChange={(e) => setConfig((c) => ({ ...c, maxPostingAgeDays: parseInt(e.target.value) }))}
              className="w-full accent-amber-500"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={config.includeNoSalary}
                onChange={(e) => setConfig((c) => ({ ...c, includeNoSalary: e.target.checked }))}
                className="accent-amber-500"
              />
              Include jobs without salary
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={config.includeContract}
                onChange={(e) => setConfig((c) => ({ ...c, includeContract: e.target.checked }))}
                className="accent-amber-500"
              />
              Include contract roles
            </label>
          </div>
        </div>
      )}

      <Button
        onClick={handleStart}
        disabled={!cvProfileId || isSearching}
        className="w-full"
      >
        {isSearching ? (
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Searching...
          </span>
        ) : (
          'Start Job Search'
        )}
      </Button>

      {!cvProfileId && (
        <p className="text-xs text-text-muted text-center">Upload a CV first to start searching</p>
      )}
    </Card>
  )
}
