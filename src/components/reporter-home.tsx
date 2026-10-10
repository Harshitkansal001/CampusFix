'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'

type Area = { id: string; name: string }
type Report = {
  id: string
  reference: string
  area_id: string
  description: string
  status: string
  created_at: string
}

const statusLabels: Record<string, string> = {
  new: 'New', assigned: 'Assigned', in_progress: 'In progress', resolved: 'Resolved', reopened: 'Reopened',
}

function Mark() {
  return <Image className="brand-seal" src="/nith-seal.jpeg" alt="" aria-hidden="true" width={36} height={36} sizes="36px" />
}

function Arrow() {
  return <span className="arrow-disc" aria-hidden="true">↗</span>
}

export default function ReporterHome() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [role, setRole] = useState('reporter')
  const [hasMoreReports, setHasMoreReports] = useState(false)
  const [loadingMoreReports, setLoadingMoreReports] = useState(false)
  const [loading, setLoading] = useState(() => isSupabaseConfigured())
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = useMemo(() => isSupabaseConfigured() ? createClient() : null, [])
  const router = useRouter()

  useEffect(() => {
    let alive = true
    if (!supabase) {
      return () => { alive = false }
    }
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!alive) return
      setUserEmail(user?.email ?? null)
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        if (alive) setRole(profile?.role ?? 'reporter')
      } else setRole('reporter')
      const areaResponse = await fetch('/api/areas')
      if (areaResponse.ok) {
        const result = await areaResponse.json()
        if (alive) setAreas(result.areas)
      }
      if (user) {
        const reportResponse = await fetch('/api/reports?offset=0')
        if (reportResponse.ok) {
          const result = await reportResponse.json()
          if (alive) {
            setReports(result.reports)
            setHasMoreReports(result.hasMore)
          }
        }
      }
      if (alive) setLoading(false)
    }
    void load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { window.setTimeout(() => void load(), 0) })
    return () => { alive = false; subscription.unsubscribe() }
  }, [supabase])

  async function loadMoreReports() {
    setLoadingMoreReports(true)
    try {
      const response = await fetch(`/api/reports?offset=${reports.length}`)
      if (!response.ok) throw new Error('Unable to load more reports.')
      const result = await response.json()
      setReports((current) => [...current, ...result.reports])
      setHasMoreReports(result.hasMore)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load more reports.')
    } finally {
      setLoadingMoreReports(false)
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    if (!userEmail) {
      router.push(`/login?next=${encodeURIComponent('/#report')}`)
      return
    }
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaId: form.get('location'),
          description: form.get('issue'),
          locationDetail: form.get('detail') || undefined,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to submit your report.')
      setReports((current) => [result.report, ...current])
      event.currentTarget.reset()
      setMessage(`Report ${result.report.reference} submitted. You can follow its progress below.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit your report.')
    } finally {
      setSubmitting(false)
    }
  }

  const areaNames = new Map(areas.map((area) => [area.id, area.name]))

  return (
    <main className="site-shell" style={{ position: 'relative', isolation: 'isolate' }}>
      <Image
        className="nith-watermark"
        src="/nith-seal.jpeg"
        alt=""
        aria-hidden="true"
        width={451}
        height={443}
        sizes="(max-width: 680px) 100vw, 680px"
        style={{ position: 'absolute', zIndex: -1, top: 100, right: '-9%', width: 'min(68vw, 680px)', height: 'auto', pointerEvents: 'none' }}
      />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CampusFix home"><Mark /><span>campus<span className="brand-light">fix</span></span></a>
        <div className="campus-label"><span className="live-dot" /> NIT HAMIRPUR <span className="label-divider">/</span> CAMPUS SERVICES</div>
        <nav className="page-nav">{userEmail && <Link href="/notifications">Notifications</Link>}{['staff', 'admin'].includes(role) && <Link href="/staff">Staff queue</Link>}{userEmail ? <button className="signin-link" onClick={() => void supabase?.auth.signOut()}>Sign out <span aria-hidden="true">↗</span></button> : <Link className="signin-link" href="/login">Sign in <span aria-hidden="true">↗</span></Link>}</nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A BETTER CAMPUS, TOGETHER</div>
          <h1>See something<br />that needs <em>fixing?</em></h1>
          <p className="hero-intro">A leaky tap. A broken light. A small issue can make a big difference to someone&apos;s day. Let the right campus team know.</p>
          <div className="trust-note"><span className="lock-icon" aria-hidden="true">⌑</span><span><strong>Your report stays private.</strong><br />Only you and the authorized campus team can see it.</span></div>
          <a className="text-link" href="#your-reports">Already reported an issue? <span>Track its progress ↗</span></a>
        </div>

        <div className="report-shell" id="report">
          <div className="report-card">
            <div className="form-heading"><div><span className="form-kicker">CAMPUSFIX · PRIVATE REPORT</span><h2>What needs attention?</h2></div><span className="step-count">01 <i>/</i> 02</span></div>
            <form onSubmit={submitReport}>
              <label className="field-label" htmlFor="issue">Describe the issue <span>REQUIRED</span></label>
              <textarea id="issue" name="issue" placeholder="Tell us what happened and what the team should know…" rows={3} required minLength={10} maxLength={5000} />
              <div className="field-row">
                <div className="location-field">
                  <label className="field-label" htmlFor="location">Where is it? <span>REQUIRED</span></label>
                  <div className="select-wrap"><span className="pin-icon" aria-hidden="true">⌖</span><select id="location" name="location" defaultValue="" required><option value="" disabled>{areas.length ? 'Select a campus area' : 'Loading campus areas…'}</option>{areas.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</select><span className="select-chevron" aria-hidden="true">⌄</span></div>
                </div>
                <div className="detail-field"><label className="field-label" htmlFor="detail">Add a detail <span>OPTIONAL</span></label><input id="detail" name="detail" placeholder="Floor, room, landmark…" maxLength={200} /></div>
              </div>
              <div className="form-footer">
                <div className="photo-note"><span className="camera-icon" aria-hidden="true">＋</span><span><strong>Photo uploads coming next</strong><small>For now, describe what you see</small></span></div>
                <button className="submit-button" type="submit" disabled={submitting || loading || !areas.length || !supabase}>{submitting ? 'Sending…' : userEmail ? 'Submit report' : 'Sign in to report'} <Arrow /></button>
              </div>
              <p className="signin-hint" role="status">{message || (userEmail ? `Signed in as ${userEmail}` : supabase ? 'Campus sign-in is required before submission.' : 'Connect a Supabase project to enable sign-in and reports.')}</p>
            </form>
          </div>
          <div className="card-footnote"><span>01</span> REPORTS ARE REVIEWED BY AUTHORIZED CAMPUS STAFF</div>
        </div>
      </section>

      <section className="updates" id="your-reports" aria-labelledby="updates-title">
        <div className="updates-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> KEEPING THINGS MOVING</div><h2 id="updates-title">Your campus,<br /><em>in progress.</em></h2></div><p>When you report an issue, you can follow its status from your own private list. The team keeps you posted as work moves forward.</p></div>
        <div className="updates-shell"><div className="updates-panel">
          <div className="panel-top"><div><span className="form-kicker">PRIVATE ACTIVITY</span><h3>Your reports <span>{reports.length.toString().padStart(2, '0')}</span></h3></div><a href="#report">Start a report <span>↗</span></a></div>
          <div className="report-list">{loading ? <p className="empty-reports">Loading your reports…</p> : !userEmail ? <p className="empty-reports"><Link href="/login">Sign in</Link> to view your private reports.</p> : reports.length ? reports.map((report) => {
            const tone = report.status === 'in_progress' || report.status === 'reopened' ? 'active' : 'assigned'
            return <Link className="report-row" href={`/reports/${report.id}`} key={report.id}><span className={`status-mark ${tone}`} aria-hidden="true" /><div className="report-info"><div className="report-id">{report.reference} <span>·</span> {areaNames.get(report.area_id) ?? 'Campus area'} · {new Date(report.created_at).toLocaleDateString()}</div><h4>{report.description}</h4></div><span className={`status-pill ${tone}`}>{statusLabels[report.status] ?? report.status}</span><span className="row-arrow" aria-hidden="true">↗</span></Link>
          }) : <p className="empty-reports">No reports yet. Use the form above to let the campus team know.</p>}{hasMoreReports && <button className="text-link" type="button" disabled={loadingMoreReports} onClick={() => void loadMoreReports()}>{loadingMoreReports ? 'Loading…' : 'Load more reports'}</button>}</div>
          <div className="panel-bottom"><span><span className="privacy-dot" /> Only you can see your reports</span><span>NEW <i>→</i> ASSIGNED <i>→</i> IN PROGRESS <i>→</i> RESOLVED</span></div>
        </div></div>
      </section>

      <footer className="footer"><a className="brand" href="#top"><Mark /><span>campus<span className="brand-light">fix</span></span></a><span>Built for the NIT Hamirpur community.</span><span className="footer-note">A campus service · Not an emergency service</span></footer>
    </main>
  )
}
