import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" })

  const teacherId = Number(req.query.teacherId)
  if (!teacherId) return res.status(400).json({ error: "Falta teacherId" })

  try {
    const [subjectsRes, enrollmentsRes, gradesRes, assignmentsRes] = await Promise.all([
      supabaseAdmin.from("subjects").select("*").eq("teacher_id", teacherId),
      supabaseAdmin.from("enrollments").select("*"),
      supabaseAdmin.from("grades").select("*"),
      supabaseAdmin.from("assignments").select("*"),
    ])

  const subjects = (subjectsRes.data ?? []) as Record<string, unknown>[]
  const enrollments = (enrollmentsRes.data ?? []) as Record<string, unknown>[]
  const grades = (gradesRes.data ?? []) as Record<string, unknown>[]
  const assignments = (assignmentsRes.data ?? []) as Record<string, unknown>[]

  const mySubjectIds = subjects.map((s: Record<string, unknown>) => Number(s.id ?? 0))
  const studentsInMySubjects = enrollments.filter((e: Record<string, unknown>) => mySubjectIds.includes(Number(e.subject_id ?? e.subjectId ?? 0)))
  const gradesInMySubjects = grades.filter((g: Record<string, unknown>) => mySubjectIds.includes(Number(g.subject_id ?? g.subjectId ?? 0)))

    let averageGrade = 0
    if (gradesInMySubjects.length > 0) {
      const sum = gradesInMySubjects.reduce((acc, g) => acc + Number(g.score || 0), 0)
      averageGrade = Math.round((sum / gradesInMySubjects.length) * 10) / 10
    }

    // pending grades calculation
    let totalPendingCount = 0
  const pendingItems: Record<string, unknown>[] = []

    for (const subject of subjects) {
  const subjectAssignments = assignments.filter((a: Record<string, unknown>) => Number(a.subject_id ?? a.subjectId ?? 0) === Number(subject.id ?? 0))
  const subjectEnrollments = enrollments.filter((e: Record<string, unknown>) => Number(e.subject_id ?? e.subjectId ?? 0) === Number(subject.id ?? 0))

      for (const assignment of subjectAssignments) {
        const assignmentGrades = grades.filter((g) => g.assignment_id === assignment.id || g.assignmentId === assignment.id)
        const studentsWithoutGrade = subjectEnrollments.length - assignmentGrades.length
        if (studentsWithoutGrade > 0) {
          pendingItems.push({ assignmentId: assignment.id, assignmentName: assignment.name ?? null, subjectName: subject.name ?? null, dueDate: assignment.due_date ?? assignment.dueDate ?? null, studentsWithoutGrade })
          totalPendingCount += studentsWithoutGrade
        }
      }
    }

    return res.status(200).json({
      mySubjects: subjects.length,
      totalStudents: new Set(studentsInMySubjects.map((s) => s.student_id ?? s.studentId)).size,
      pendingGrades: totalPendingCount,
      averageGrade,
      pendingDetails: pendingItems,
    })
  } catch (err) {
    console.error("teacher stats error:", err)
    return res.status(500).json({ error: "Error interno" })
  }
}
