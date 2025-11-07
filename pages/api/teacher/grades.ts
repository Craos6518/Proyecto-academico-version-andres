import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import { withAuth } from "../../../lib/middleware/auth"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { subjectId, studentId } = req.query
      let query = supabaseAdmin.from("grades").select("*")
      if (subjectId) query = query.eq("subject_id", Number(subjectId))
      if (studentId) query = query.eq("student_id", Number(studentId))
      const { data, error } = await query
      if (error) throw error
      // Normalize rows to a typed-friendly shape
      const rows = (data || []) as Array<Record<string, unknown>>
      const mapped = rows.map((r) => ({
        id: Number(r["id"] ?? 0),
        studentId: Number(r["student_id"] ?? r["studentId"] ?? 0),
        assignmentId: Number(r["assignment_id"] ?? r["assignmentId"] ?? 0),
        subjectId: Number(r["subject_id"] ?? r["subjectId"] ?? 0),
        score: Number(r["score"] ?? 0),
        gradedBy: Number(r["graded_by"] ?? r["gradedBy"] ?? 0),
        gradedAt: r["graded_at"] ?? r["gradedAt"] ?? null,
        comments: r["comments"] ?? r["comment"] ?? null,
      }))
      return res.status(200).json(mapped)
    }

    if (req.method === "POST") {
      const payload = req.body as Record<string, unknown>
      const dbPayload = {
        ...(payload.id ? { id: payload.id } : {}),
        student_id: payload.studentId ?? payload.student_id,
        assignment_id: payload.assignmentId ?? payload.assignment_id,
        subject_id: payload.subjectId ?? payload.subject_id,
        score: payload.score ?? payload.score,
        comments: payload.comments ?? payload.comment ?? null,
        graded_by: payload.gradedBy ?? payload.graded_by ?? null,
        graded_at: payload.gradedAt ?? payload.graded_at ?? null,
      }
      if (!dbPayload.id) {
        try {
          const { data: maxRow, error: maxErr } = await supabaseAdmin.from("grades").select("id").order("id", { ascending: false }).limit(1).maybeSingle()
          const maybeId = maxRow ? (maxRow as Record<string, unknown>)?.id : undefined
          if (!maxErr && maybeId !== undefined && maybeId !== null) {
            dbPayload.id = Number(maybeId) + 1
          } else {
            dbPayload.id = 1
          }
        } catch {
          dbPayload.id = 1
        }
      }
      // Validation: score must be between 0.0 and 5.0
      const scoreVal = Number(dbPayload.score ?? NaN)
      if (Number.isNaN(scoreVal) || scoreVal < 0 || scoreVal > 5) {
        return res.status(400).json({ error: "La calificación debe estar entre 0.0 y 5.0" })
      }

      // Validation: graded_at (if provided) cannot be before now
      if (dbPayload.graded_at) {
        const provided = new Date(String(dbPayload.graded_at))
        if (isNaN(provided.getTime())) {
          return res.status(400).json({ error: "Fecha de calificación inválida" })
        }
        const now = new Date()
        // If provided is before now (past), reject
        if (provided.getTime() < now.getTime() - 1000) {
          return res.status(400).json({ error: "La fecha de la calificación no puede ser anterior a la fecha actual" })
        }
      }

      const { data, error } = await supabaseAdmin.from("grades").insert(dbPayload).select().limit(1).single()
      if (error) throw error
      const row = data as Record<string, unknown>
      return res.status(201).json({
        id: Number(row["id"] ?? 0),
        studentId: Number(row["student_id"] ?? row["studentId"] ?? 0),
        assignmentId: Number(row["assignment_id"] ?? row["assignmentId"] ?? 0),
        subjectId: Number(row["subject_id"] ?? row["subjectId"] ?? 0),
        score: Number(row["score"] ?? 0),
        gradedBy: Number(row["graded_by"] ?? row["gradedBy"] ?? 0),
        gradedAt: row["graded_at"] ?? row["gradedAt"] ?? null,
        comments: row["comments"] ?? row["comment"] ?? null,
      })
    }

    if (req.method === "PUT") {
      const { id, ...updates } = req.body as Record<string, unknown>
      if (!id) return res.status(400).json({ error: "Missing id" })
      const dbUpdates: Record<string, unknown> = {}
      if ((updates as Record<string, unknown>).score !== undefined) {
        const s = Number((updates as Record<string, unknown>).score)
        if (Number.isNaN(s) || s < 0 || s > 5) return res.status(400).json({ error: "La calificación debe estar entre 0.0 y 5.0" })
        dbUpdates.score = s
      }
      if ((updates as Record<string, unknown>).comments !== undefined) dbUpdates.comments = (updates as Record<string, unknown>).comments
      const { data, error } = await supabaseAdmin.from("grades").update(dbUpdates).eq("id", id).select().limit(1).single()
      if (error) throw error
      const row = data as Record<string, unknown>
      return res.status(200).json({
        id: Number(row["id"] ?? 0),
        studentId: Number(row["student_id"] ?? row["studentId"] ?? 0),
        assignmentId: Number(row["assignment_id"] ?? row["assignmentId"] ?? 0),
        subjectId: Number(row["subject_id"] ?? row["subjectId"] ?? 0),
        score: Number(row["score"] ?? 0),
        gradedBy: Number(row["graded_by"] ?? row["gradedBy"] ?? 0),
        gradedAt: row["graded_at"] ?? row["gradedAt"] ?? null,
        comments: row["comments"] ?? row["comment"] ?? null,
      })
    }

    if (req.method === "DELETE") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing id" })
      const gid = Number(id)

      // Authorization: if caller is teacher, verify the grade belongs to a subject they teach
      const user = (req as unknown as { user?: unknown }).user as Record<string, unknown> | undefined
      if (user) {
        const roleRaw = user["role"] ?? user["roleName"] ?? user["role_name"]
        const role = String(roleRaw ?? "")
        if (role && role.toLowerCase().includes("teacher")) {
          // get the grade row to find subject_id (or assignment -> subject relationship)
          const { data: gradeRow, error: gErr } = await supabaseAdmin.from("grades").select("subject_id, assignment_id").eq("id", gid).limit(1).maybeSingle()
          if (gErr) throw gErr
          const subjectId = gradeRow ? Number((gradeRow as Record<string, unknown>)['subject_id'] ?? 0) : 0
          let teacherId = 0
          if (subjectId) {
            const { data: subj, error: sErr } = await supabaseAdmin.from("subjects").select("teacher_id").eq("id", subjectId).limit(1).maybeSingle()
            if (sErr) throw sErr
            teacherId = subj ? Number((subj as Record<string, unknown>)['teacher_id'] ?? 0) : 0
          } else {
            // fallback: if subject_id not present on grade, try through assignment
            const assignmentId = gradeRow ? Number((gradeRow as Record<string, unknown>)['assignment_id'] ?? 0) : 0
            if (assignmentId) {
              const { data: asg, error: aErr } = await supabaseAdmin.from("assignments").select("subject_id").eq("id", assignmentId).limit(1).maybeSingle()
              if (aErr) throw aErr
              const sid = asg ? Number((asg as Record<string, unknown>)['subject_id'] ?? 0) : 0
              if (sid) {
                const { data: subj2, error: s2Err } = await supabaseAdmin.from("subjects").select("teacher_id").eq("id", sid).limit(1).maybeSingle()
                if (s2Err) throw s2Err
                teacherId = subj2 ? Number((subj2 as Record<string, unknown>)['teacher_id'] ?? 0) : 0
              }
            }
          }

          const callerId = Number(user["id"] ?? user["userId"] ?? 0)
          if (teacherId && callerId && teacherId !== callerId) {
            return res.status(403).json({ error: "No tienes permiso para eliminar esta calificación" })
          }
        }
      }

      const { error } = await supabaseAdmin.from("grades").delete().eq("id", gid)
      if (error) throw error
      return res.status(204).end()
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: unknown) {
    console.error("teacher/grades error:", err)
    const message = (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message?: unknown }).message) : String(err ?? 'Error interno')
    return res.status(500).json({ error: message })
  }
}

export default withAuth(handler, ["teacher", "admin", "director"])
