import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"
import { supabaseAdmin } from "../../../lib/supabase-client"
import { normalizeRole } from "../../../lib/auth"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" })

    const subjectIdParam = req.query.subjectId
    const reqUser = (req as unknown as { user?: Record<string, unknown> }).user
    const payloadRoleRaw = reqUser ? (reqUser["role"] ?? reqUser["roleName"] ?? reqUser["role_name"]) as string | undefined : undefined
    const payloadRole = normalizeRole(payloadRoleRaw)

    // If teacher requests without subjectId, return enrollments for all their subjects
    if (payloadRole === "teacher") {
      const teacherId = Number(reqUser?.["id"] ?? reqUser?.["userId"] ?? 0)
      if (!teacherId) return res.status(401).json({ error: "Usuario no autenticado" })

      // If a specific subjectId is provided, ensure teacher owns it
      if (subjectIdParam !== undefined) {
        const sid = Number(subjectIdParam)
        if (Number.isNaN(sid)) return res.status(400).json({ error: "subjectId inválido" })
        const { data: subjectRow, error: subjErr } = await supabaseAdmin.from("subjects").select("teacher_id").eq("id", sid).maybeSingle()
        if (subjErr) throw subjErr
        const teacherOfSubject = subjectRow ? (subjectRow["teacher_id"] ?? subjectRow["teacherId"]) as number | undefined : undefined
        if (!teacherOfSubject || Number(teacherOfSubject) !== Number(teacherId)) {
          return res.status(403).json({ error: "No tienes permisos para ver inscripciones de esta materia" })
        }
        const { data, error } = await supabaseAdmin.from("enrollments").select("*").eq("subject_id", sid)
        if (error) throw error
        return res.status(200).json((data || []).map((r: Record<string, unknown>) => ({
          id: r["id"],
          studentId: r["student_id"],
          subjectId: r["subject_id"],
          enrollmentDate: r["enrollment_date"],
          status: r["status"],
        })))
      }

      // no subjectId: fetch subjects for this teacher and then enrollments
      const { data: subjects, error: sErr } = await supabaseAdmin.from("subjects").select("id").eq("teacher_id", teacherId)
      if (sErr) throw sErr
      const subjectIds = (subjects || []).map((s: Record<string, unknown>) => Number(s["id"]))
      if (subjectIds.length === 0) return res.status(200).json([])
      const { data, error } = await supabaseAdmin.from("enrollments").select("*").in("subject_id", subjectIds)
      if (error) throw error
      return res.status(200).json((data || []).map((r: Record<string, unknown>) => ({
        id: r["id"],
        studentId: r["student_id"],
        subjectId: r["subject_id"],
        enrollmentDate: r["enrollment_date"],
        status: r["status"],
      })))
    }

    // For admin/director: allow optional subjectId filter or return all
    let query = supabaseAdmin.from("enrollments").select("*")
    if (subjectIdParam !== undefined) {
      const sid = Number(subjectIdParam)
      if (!Number.isNaN(sid)) query = query.eq("subject_id", sid)
    }
    const { data, error } = await query
    if (error) throw error
    return res.status(200).json((data || []).map((r: Record<string, unknown>) => ({
      id: r["id"],
      studentId: r["student_id"],
      subjectId: r["subject_id"],
      enrollmentDate: r["enrollment_date"],
      status: r["status"],
    })))
  } catch (err: unknown) {
    console.error("teacher/enrollments error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: message || "Error interno" })
  }
}

export default withAuth(handler, ["teacher", "admin", "director"])
