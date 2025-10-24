import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseApiClient } from '@/lib/supabase-api-client'
import { normalizeRole, verifyJWT } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Authorization: Bearer <token>
    const authHeader = String(req.headers.authorization ?? '')
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization token' })
    }
    const token = authHeader.split(' ')[1]
    const payload = verifyJWT(token)
    if (!payload) return res.status(401).json({ error: 'Invalid token' })
    const role = normalizeRole(payload.role)
    if (role !== 'director' && role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

    const subjects = await supabaseApiClient.getSubjects()

    const subjectReports = await Promise.all(
      subjects.map(async (subject) => {
        const enrollments = await supabaseApiClient.getEnrollmentsBySubject(subject.id)
        const grades = await supabaseApiClient.getGradesBySubject(subject.id)

        const averageGrade = grades.length > 0 ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length : 0
        const approvedGrades = grades.filter((g) => g.score >= 3.0).length
        const approvalRate = grades.length > 0 ? (approvedGrades / grades.length) * 100 : 0

        return {
          subject,
          enrolledStudents: enrollments.length,
          averageGrade: Math.round(averageGrade * 10) / 10,
          approvalRate: Math.round(approvalRate * 10) / 10,
          totalGrades: grades.length,
        }
      }),
    )

    const users = await supabaseApiClient.getUsers()
    const students = users.filter((u) => normalizeRole(u.role ?? u.roleName) === 'student')

    const studentReports = await Promise.all(
      students.map(async (student) => {
        const enrollments = await supabaseApiClient.getEnrollmentsByStudent(student.id)
        const grades = await supabaseApiClient.getGradesByStudent(student.id)

        const averageGrade = grades.length > 0 ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length : 0
        const approvedGrades = grades.filter((g) => g.score >= 3.0).length
        const approvalRate = grades.length > 0 ? (approvedGrades / grades.length) * 100 : 0

        return {
          student,
          enrolledSubjects: enrollments.length,
          averageGrade: Math.round(averageGrade * 10) / 10,
          approvalRate: Math.round(approvalRate * 10) / 10,
        }
      }),
    )

    return res.status(200).json({ subjectReports, studentReports })
  } catch (err) {
    console.error('analytics/summary error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
