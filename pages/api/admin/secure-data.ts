import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Obtener usuarios
    const { data: usersData, error: usersError } = await supabaseAdmin.from("users").select("id, username, role_name")
    if (usersError) throw usersError
    const users = (usersData || []).map((u) => {
      const ru = u as unknown as Record<string, unknown>
      return {
        id: ru["id"] as number,
        name: (ru["username"] ?? "") as string,
        role: (ru["role_name"] ?? "") as string,
      }
    })

    // Obtener materias
    const { data: subjectsData, error: subjectsError } = await supabaseAdmin.from("subjects").select("id, name")
    if (subjectsError) throw subjectsError
    const subjects = (subjectsData || []).map((s) => {
      const rs = s as unknown as Record<string, unknown>
      return {
        id: rs["id"] as number,
        name: (rs["name"] ?? "") as string,
      }
    })

    // Obtener logs (si existe la tabla logs)
    let logs: unknown[] = []
    let totalLogs = 0
    try {
      const { data: logsData, error: logsError } = await supabaseAdmin.from("logs").select("id, action, user, date")
      if (!logsError && logsData) {
        logs = logsData as unknown[]
        totalLogs = (logsData as unknown[]).length
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
  } catch (err: unknown) {
    console.error("admin secure-data error:", err)
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message || "Error interno" })
  }
}, ["admin"]);
