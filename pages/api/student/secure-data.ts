
import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Solo método GET
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" })

  // Obtener el id del usuario autenticado
  const user = (req as any).user
  const studentId = user?.id || user?.user_id || user?.userId
  if (!studentId) return res.status(400).json({ error: "No se pudo identificar al estudiante" })

  try {
    // Obtener materias inscritas y calificaciones
    const [enrollRes, gradesRes, messagesRes] = await Promise.all([
      supabaseAdmin.from("enrollments").select("subject_id, subjects(name)").eq("student_id", studentId),
      supabaseAdmin.from("grades").select("subject_id, score, subjects(name)").eq("student_id", studentId),
      supabaseAdmin.from("messages").select("from, subject, message").eq("student_id", studentId),
    ])

    const subjects = (enrollRes.data ?? []).map((e: any) => ({ name: e.subjects?.name || "", subject_id: e.subject_id }))
  const grades = (gradesRes.data ?? []).map((g: any) => ({ name: g.subjects?.name || "", grade: Number(g.score), subject_id: g.subject_id }))
    const messages = messagesRes.data ?? []

    // Calcular promedio
    let average = 0
    if (grades.length > 0) {
      average = Math.round((grades.reduce((acc, s) => acc + s.grade, 0) / grades.length) * 100) / 100
    }

    // Enlaces de exportación (pueden ser rutas reales si existen)
    const exportLinks = {
      csv: `/api/student/grades.csv?studentId=${studentId}`,
      pdf: `/api/student/grades.pdf?studentId=${studentId}`,
    }

    res.status(200).json({
      message: 'Acceso concedido solo a estudiante',
      subjects,
      grades,
      average,
      messages,
      exportLinks,
    })
  } catch (err) {
    console.error("student secure-data error:", err)
    res.status(500).json({ error: "Error interno" })
  }
}, ["student"]);
