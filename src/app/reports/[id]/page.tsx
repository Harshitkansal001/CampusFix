import ReportDetail from '@/components/report-detail'
import { Suspense } from 'react'
import { connection } from 'next/server'

async function ReportContent({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  return <ReportDetail id={id} />
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="site-shell"><p className="page-message">Loading report…</p></main>}><ReportContent params={params} /></Suspense>
}
