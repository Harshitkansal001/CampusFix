'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'

type Report = { id: string; reference: string; description: string; status: string; priority: string | null; created_at: string; areas: { name: string } | null }
const labels: Record<string, string> = { new: 'New', assigned: 'Assigned', in_progress: 'In progress', resolved: 'Resolved', reopened: 'Reopened' }
const nextStatuses: Record<string, string[]> = { new: ['assigned'], assigned: ['in_progress', 'resolved'], in_progress: ['resolved'], resolved: ['reopened'], reopened: ['assigned', 'in_progress', 'resolved'] }

export default function StaffDashboard() {
  const supabase = useMemo(() => isSupabaseConfigured() ? createClient() : null, [])
  const [reports, setReports] = useState<Report[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [message, setMessage] = useState(() => supabase ? 'Loading staff queue…' : 'CampusFix is not configured. Set the Supabase environment variables to continue.')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    let active = true
    if (!supabase) return () => { active = false }
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (active) setMessage('Sign in with an authorized staff account.'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if (!active) return
      if (!profile || !['staff', 'admin'].includes(profile.role)) { setMessage('This page is for authorized campus staff.'); return }
      const response = await fetch('/api/reports')
      const result = await response.json()
      if (!active) return
      if (!response.ok) { setMessage(result.error ?? 'Unable to load staff queue.'); return }
      setReports(result.reports)
      setHasMore(result.hasMore)
      setMessage(result.reports.length ? '' : 'No reports are assigned to your campus areas yet.')
    })()
    return () => { active = false }
  }, [supabase])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const response = await fetch(`/api/reports?offset=${reports.length}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to load more reports.')
      setReports((current) => [...current, ...result.reports])
      setHasMore(result.hasMore)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load more reports.')
    } finally {
      setLoadingMore(false)
    }
  }

  async function update(report: Report, values: { status?: string; priority?: string }) {
    setBusyId(report.id)
    const response = await fetch(`/api/reports/${report.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    const result = await response.json()
    setBusyId('')
    if (!response.ok) { setMessage(result.error ?? 'Unable to update report.'); return }
    setReports((current) => current.map((item) => item.id === report.id ? { ...item, ...result.report } : item))
    setMessage('Report updated.')
  }

  return <main className="site-shell"><header className="topbar"><Link className="brand" href="/">Campus<span className="brand-light">Fix</span></Link><nav className="page-nav"><Link href="/">Reporter home</Link><Link href="/notifications">Notifications</Link></nav></header>
    <section className="page-content"><div className="eyebrow"><span className="eyebrow-line" /> AUTHORIZED CAMPUS STAFF</div><h1 className="page-title">Staff queue</h1>{message && <p className="page-message" role="status">{message}</p>}
      <div className="queue-list">{reports.map((report) => <article className="queue-row" key={report.id}><div><span className="report-id">{report.reference} · {report.areas?.name ?? 'Campus area'} · {new Date(report.created_at).toLocaleDateString()}</span><Link href={`/reports/${report.id}`}><h2>{report.description}</h2></Link><span className="status-pill">{labels[report.status] ?? report.status}</span></div><div className="staff-controls"><label>Status<select disabled={busyId === report.id} value={report.status} onChange={(event) => void update(report, { status: event.target.value })}><option value={report.status}>{labels[report.status]}</option>{(nextStatuses[report.status] ?? []).map((value) => <option value={value} key={value}>{labels[value]}</option>)}</select></label><label>Priority<select disabled={busyId === report.id} value={report.priority ?? ''} onChange={(event) => void update(report, { priority: event.target.value })}><option value="">No priority</option>{['low', 'medium', 'high', 'urgent'].map((value) => <option value={value} key={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label></div></article>)}{hasMore && <button className="text-link" type="button" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? 'Loading…' : 'Load more reports'}</button>}</div>
    </section></main>
}
