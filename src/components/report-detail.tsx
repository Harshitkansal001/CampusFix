'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'

type Report = {
  id: string; reference: string; area_id: string; location_detail: string | null; description: string
  status: string; priority: string | null; reporter_id: string; areas: { name: string } | null
  categories: { name: string } | null; created_at: string; updated_at: string
}
type Event = { event_type: string; details: Record<string, unknown>; created_at: string }
const labels: Record<string, string> = { new: 'New', assigned: 'Assigned', in_progress: 'In progress', resolved: 'Resolved', reopened: 'Reopened' }
const nextStatuses: Record<string, string[]> = { new: ['assigned'], assigned: ['in_progress', 'resolved'], in_progress: ['resolved'], resolved: ['reopened'], reopened: ['assigned', 'in_progress', 'resolved'] }

export default function ReportDetail({ id }: { id: string }) {
  const supabase = useMemo(() => isSupabaseConfigured() ? createClient() : null, [])
  const [report, setReport] = useState<Report | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [role, setRole] = useState('reporter')
  const [message, setMessage] = useState(() => supabase ? 'Loading report…' : 'CampusFix is not configured. Set the Supabase environment variables to continue.')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    if (!supabase) return () => { active = false }
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (active) setMessage('Sign in to view this report.'); return }
      const [{ data: profile }, response] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(), fetch(`/api/reports/${id}`),
      ])
      if (!active) return
      setRole(profile?.role ?? 'reporter')
      const result = await response.json()
      if (!response.ok) { setMessage(result.error ?? 'Unable to load report.'); return }
      setReport(result.report)
      setEvents(result.events)
      setMessage('')
    })()
    return () => { active = false }
  }, [id, supabase])

  async function update(values: { status?: string; priority?: string }) {
    if (!report) return
    setSaving(true)
    setMessage('')
    const response = await fetch(`/api/reports/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    const result = await response.json()
    setSaving(false)
    if (!response.ok) { setMessage(result.error ?? 'Unable to update report.'); return }
    setReport(result.report)
    const refreshed = await fetch(`/api/reports/${id}`)
    if (refreshed.ok) setEvents((await refreshed.json()).events)
    setMessage('Report updated.')
  }

  const canManage = role === 'staff' || role === 'admin'
  return <main className="site-shell"><header className="topbar"><Link className="brand" href="/">Campus<span className="brand-light">Fix</span></Link><nav className="page-nav"><Link href="/notifications">Notifications</Link><Link href={canManage ? '/staff' : '/'}>{canManage ? 'Staff queue' : 'Back to reports'}</Link></nav></header>
    <section className="page-content"><div className="eyebrow"><span className="eyebrow-line" /> REPORT DETAILS</div>{message && <p className="page-message" role="status">{message}</p>}{message === 'Sign in to view this report.' && <Link className="submit-button" href={`/login?next=%2Freports%2F${id}`}>Sign in <span className="arrow-disc">↗</span></Link>}
      {report && <article className="detail-card"><div className="detail-heading"><div><span className="report-id">{report.reference} · {report.areas?.name ?? 'Campus area'}</span><h1>{report.description}</h1></div><span className="status-pill">{labels[report.status] ?? report.status}</span></div>
        <p className="detail-meta">Submitted {new Date(report.created_at).toLocaleString()}{report.location_detail ? ` · ${report.location_detail}` : ''}</p>
        <div className="detail-facts"><span>Category: {report.categories?.name ?? 'Not assigned'}</span><span>Priority: {report.priority ?? 'Not set'}</span></div>
        {canManage && <div className="staff-controls"><label>Status<select value={report.status} disabled={saving} onChange={(event) => void update({ status: event.target.value })}><option value={report.status}>{labels[report.status]}</option>{(nextStatuses[report.status] ?? []).map((value) => <option value={value} key={value}>{labels[value]}</option>)}</select></label><label>Priority<select value={report.priority ?? ''} disabled={saving} onChange={(event) => void update({ priority: event.target.value })}><option value="">Choose priority</option>{['low', 'medium', 'high', 'urgent'].map((value) => <option value={value} key={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label></div>}
        {message && <p className="signin-hint" role="status">{message}</p>}<section className="history"><h2>Activity</h2>{events.map((event, index) => <div className="history-row" key={`${event.created_at}-${index}`}><span>{event.event_type === 'created' ? 'Report submitted' : 'Report updated'}</span><time>{new Date(event.created_at).toLocaleString()}</time></div>)}</section>
      </article>}
    </section></main>
}
