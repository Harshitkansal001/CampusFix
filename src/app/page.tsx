import ReporterHome from '@/components/reporter-home'
import { Suspense } from 'react'
import { connection } from 'next/server'

async function HomeContent() {
  await connection()
  return <ReporterHome />
}

export default function Home() {
  return <Suspense fallback={<main className="site-shell" />}><HomeContent /></Suspense>
}
