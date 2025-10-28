import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import { normalizeRole } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" })

  try {
    const [usersRes, subjectsRes, gradesRes] = await Promise.all([
      supabaseAdmin.from("users").select("*") ,
      supabaseAdmin.from("subjects").select("*") ,
      supabaseAdmin.from("grades").select("*") ,
    ])

    const users = (usersRes.data ?? []) as Record<string, unknown>[]
    const subjects = (subjectsRes.data ?? []) as Record<string, unknown>[]
    const grades = (gradesRes.data ?? []) as Record<string, unknown>[]

    const usersTyped = users as Array<Record<string, unknown>>
    const subjectsTyped = subjects as Array<Record<string, unknown>>
    const gradesTyped = grades as Array<Record<string, unknown>>

    const students = usersTyped.filter((u) => {
      const rawRole = u["role_name"] ?? u["roleName"] ?? u["role"]
      return normalizeRole(String(rawRole ?? "")) === "student"
    })

    const averageGrade = gradesTyped.length > 0
      ? Math.round((gradesTyped.reduce((sum: number, g: Record<string, unknown>) => sum + Number(g["score"] ?? 0), 0) / gradesTyped.length) * 10) / 10
      : 0

    const approvedGrades = gradesTyped.filter((g) => Number(g["score"] ?? 0) >= 3.0).length
    const approvalRate = gradesTyped.length > 0 ? Math.round((approvedGrades / gradesTyped.length) * 1000) / 10 : 0

    const totalTeachers = usersTyped.filter((u) => {
      const rawRole = u["role_name"] ?? u["roleName"] ?? u["role"]
      return normalizeRole(String(rawRole ?? "")) === "teacher"
    }).length

    const totalSubjects = subjectsTyped.length

    return res.status(200).json({
      totalStudents: students.length,
      totalTeachers,
      totalSubjects,
      averageGrade,
      approvalRate,
    })
  } catch (err: unknown) {
    console.error("director stats error:", err)
    const message = (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message?: unknown }).message) : String(err ?? 'Error interno')
    return res.status(500).json({ error: message })
  }
}
