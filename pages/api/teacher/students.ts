import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"
import { supabaseAdmin } from "../../../lib/supabase-client"
import { normalizeRole } from "../../../lib/auth"

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" })

    const subjectIdParam = req.query.subjectId
    const reqUser = (req as unknown as { user?: Record<string, unknown> }).user
    const payloadRoleRaw = reqUser ? (reqUser["role"] ?? reqUser["roleName"] ?? reqUser["role_name"]) as string | undefined : undefined
    const payloadRole = normalizeRole(payloadRoleRaw)

    let studentIds: number[] = []

    if (payloadRole === "teacher") {
      const teacherId = Number(reqUser?.["id"] ?? reqUser?.["userId"] ?? 0)
      if (!teacherId) return res.status(401).json({ error: "Usuario no autenticado" })

      if (subjectIdParam !== undefined) {
        const sid = Number(subjectIdParam)
        if (Number.isNaN(sid)) return res.status(400).json({ error: "subjectId inválido" })
        // Verify teacher owns subject
        const { data: subjectRow, error: subjErr } = await supabaseAdmin.from("subjects").select("teacher_id").eq("id", sid).maybeSingle()
        if (subjErr) throw subjErr
        const teacherOfSubject = subjectRow ? (subjectRow["teacher_id"] ?? subjectRow["teacherId"]) as number | undefined : undefined
        if (!teacherOfSubject || Number(teacherOfSubject) !== Number(teacherId)) {
          return res.status(403).json({ error: "No tienes permisos para ver estudiantes de esta materia" })
        }
        const { data: enrollments, error: eErr } = await supabaseAdmin.from("enrollments").select("student_id").eq("subject_id", sid)
        if (eErr) throw eErr
        studentIds = (enrollments || []).map((r: Record<string, unknown>) => Number(r["student_id"]))
      } else {
        // No subjectId: return students across all teacher's subjects
        const { data: subjects, error: sErr } = await supabaseAdmin.from("subjects").select("id").eq("teacher_id", teacherId)
        if (sErr) throw sErr
        const subjectIds = (subjects || []).map((s: Record<string, unknown>) => Number(s["id"]))
        if (subjectIds.length === 0) return res.status(200).json([])
        const { data: enrollments, error: eErr } = await supabaseAdmin.from("enrollments").select("student_id").in("subject_id", subjectIds)
        if (eErr) throw eErr
        studentIds = (enrollments || []).map((r: Record<string, unknown>) => Number(r["student_id"]))
      }
    } else {
      // admin/director: allow subjectId filter or return all users with role student
      if (subjectIdParam !== undefined) {
        const sid = Number(subjectIdParam)
        if (Number.isNaN(sid)) return res.status(400).json({ error: "subjectId inválido" })
        const { data: enrollments, error: eErr } = await supabaseAdmin.from("enrollments").select("student_id").eq("subject_id", sid)
        if (eErr) throw eErr
        studentIds = (enrollments || []).map((r: Record<string, unknown>) => Number(r["student_id"]))
      } else {
        // return all students
        const { data: users, error: uErr } = await supabaseAdmin.from("users").select("id").in("role", ["student"])
        if (uErr) throw uErr
        studentIds = (users || []).map((u: Record<string, unknown>) => Number(u["id"]))
      }
    }

    // Remove duplicates
    studentIds = Array.from(new Set(studentIds.filter((id) => !!id)))
    if (studentIds.length === 0) return res.status(200).json([])

  // Select only actual DB column names (snake_case). Avoid requesting camelCase columns which don't exist in Postgres.
  const { data: usersData, error: usersErr } = await supabaseAdmin.from("users").select("id, first_name, last_name, email, role").in("id", studentIds)
    if (usersErr) throw usersErr

    const mapped = (usersData || []).map((u: Record<string, unknown>) => ({
      id: Number(u["id"] ?? u["ID"] ?? 0),
      firstName: String(u["first_name"] ?? u["firstName"] ?? ""),
      lastName: String(u["last_name"] ?? u["lastName"] ?? ""),
      email: String(u["email"] ?? ""),
      role: String(u["role"] ?? ""),
    }))

    return res.status(200).json(mapped)
  } catch (err: unknown) {
    console.error("teacher/students error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: message || "Error interno" })
  }
}, ["teacher", "admin", "director"])
