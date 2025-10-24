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

    const subjects = (subjectsRes.data ?? []) as any[]
    const enrollments = (enrollmentsRes.data ?? []) as any[]
    const grades = (gradesRes.data ?? []) as any[]
    const assignments = (assignmentsRes.data ?? []) as any[]

    const mySubjectIds = subjects.map((s) => s.id)
    const studentsInMySubjects = enrollments.filter((e) => mySubjectIds.includes(e.subject_id ?? e.subjectId))
    const gradesInMySubjects = grades.filter((g) => mySubjectIds.includes(g.subject_id ?? g.subjectId))

    let averageGrade = 0
    if (gradesInMySubjects.length > 0) {
      const sum = gradesInMySubjects.reduce((acc, g) => acc + Number(g.score || 0), 0)
      averageGrade = Math.round((sum / gradesInMySubjects.length) * 10) / 10
    }

    // pending grades calculation
    let totalPendingCount = 0
    const pendingItems: any[] = []

    for (const subject of subjects) {
      const subjectAssignments = assignments.filter((a) => a.subject_id === subject.id || a.subjectId === subject.id)
      const subjectEnrollments = enrollments.filter((e) => e.subject_id === subject.id || e.subjectId === subject.id)

      for (const assignment of subjectAssignments) {
        const assignmentGrades = grades.filter((g) => g.assignment_id === assignment.id || g.assignmentId === assignment.id)
        const studentsWithoutGrade = subjectEnrollments.length - assignmentGrades.length
        if (studentsWithoutGrade > 0) {
          pendingItems.push({ assignmentId: assignment.id, assignmentName: assignment.name, subjectName: subject.name, dueDate: assignment.due_date ?? assignment.dueDate, studentsWithoutGrade })
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
