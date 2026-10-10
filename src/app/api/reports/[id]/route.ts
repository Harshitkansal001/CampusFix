import { z } from 'zod'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const updateReport = z.object({
  status: z.enum(['new', 'assigned', 'in_progress', 'resolved', 'reopened']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  categoryId: z.uuid().optional(),
  assignedTo: z.uuid().optional(),
}).refine((value) => Object.keys(value).length > 0)

export async function PATCH(request: Request, { params }: RouteContext<'/api/reports/[id]'>) {
  await connection()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) return Response.json({ error: 'Invalid report ID' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 })

  const parsed = updateReport.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid update', details: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase.rpc('update_report', {
    p_report_id: id,
    p_status: parsed.data.status ?? null,
    p_priority: parsed.data.priority ?? null,
    p_category_id: parsed.data.categoryId ?? null,
    p_assigned_to: parsed.data.assignedTo ?? null,
  })
  if (error) return Response.json({ error: error.code === '22023' ? 'Invalid workflow update' : 'Report not found or access denied' }, { status: error.code === '22023' ? 400 : 404 })
  return Response.json({ report: data })
}
