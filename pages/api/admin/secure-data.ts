import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Obtener usuarios
    const { data: usersData, error: usersError } = await supabaseAdmin.from("users").select("id, username, role_name")
    if (usersError) throw usersError
    const users = (usersData || []).map((u: any) => ({
      id: u.id,
      name: u.username,
      role: u.role_name,
    }))

    // Obtener materias
    const { data: subjectsData, error: subjectsError } = await supabaseAdmin.from("subjects").select("id, name")
    if (subjectsError) throw subjectsError
    const subjects = (subjectsData || []).map((s: any) => ({
      id: s.id,
      name: s.name,
    }))

    // Obtener logs (si existe la tabla logs)
    let logs: any[] = []
    let totalLogs = 0
    try {
      const { data: logsData, error: logsError } = await supabaseAdmin.from("logs").select("id, action, user, date")
      if (!logsError && logsData) {
        logs = logsData
        totalLogs = logs.length
      }
    } catch {}

    res.status(200).json({
      message: 'Acceso concedido solo a administrador',
      users,
      subjects,
      logs,
      stats: {
        totalUsers: users.length,
        totalSubjects: subjects.length,
        totalLogs,
      },
    })
  } catch (err) {
    console.error("admin secure-data error:", err)
    res.status(500).json({ error: "Error interno" })
  }
}, ["admin"]);
function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as any).user
  res.status(200).json({
    message: `Acceso permitido para ${user.username} con rol ${user.role}`,
    user,
  })
}

// Solo permite acceso a usuarios con rol 'admin'
