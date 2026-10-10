'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Notification = { id: number; report_id: string; message: string; read_at: string | null; created_at: string }

export default function NotificationsInbox() {
  const [items, setItems] = useState<Notification[]>([])
  const [message, setMessage] = useState('Loading notifications…')
  useEffect(() => {
    let active = true
    void fetch('/api/notifications').then(async (response) => {
      const result = await response.json()
      if (!active) return
      if (!response.ok) { setMessage(response.status === 401 ? 'Sign in to view notifications.' : result.error ?? 'Unable to load notifications.'); return }
      setItems(result.notifications)
      setMessage(result.notifications.length ? '' : 'You’re all caught up.')
    }).catch(() => { if (active) setMessage('Unable to load notifications.') })
    return () => { active = false }
  }, [])

  async function markRead(item: Notification) {
    const response = await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) })
    if (!response.ok) { setMessage('Unable to mark notification as read.'); return }
    setItems((current) => current.map((notification) => notification.id === item.id ? { ...notification, read_at: new Date().toISOString() } : notification))
  }

  return <main className="site-shell"><header className="topbar"><Link className="brand" href="/">Campus<span className="brand-light">Fix</span></Link><nav className="page-nav"><Link href="/">Your reports</Link><Link href="/staff">Staff queue</Link></nav></header>
    <section className="page-content"><div className="eyebrow"><span className="eyebrow-line" /> CAMPUSFIX UPDATES</div><h1 className="page-title">Notifications</h1>{message && <p className="page-message" role="status">{message}</p>}{message === 'Sign in to view notifications.' && <Link className="submit-button" href="/login?next=%2Fnotifications">Sign in <span className="arrow-disc">↗</span></Link>}
      <div className="queue-list">{items.map((item) => <article className={`notification-row${item.read_at ? '' : ' unread'}`} key={item.id}><div><p>{item.message}</p><time>{new Date(item.created_at).toLocaleString()}</time></div><div className="notification-actions"><Link href={`/reports/${item.report_id}`}>View report ↗</Link>{!item.read_at && <button type="button" onClick={() => void markRead(item)}>Mark read</button>}</div></article>)}</div>
    </section></main>
}
