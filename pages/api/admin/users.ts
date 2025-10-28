import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import type { Role } from "../../../lib/types"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin.from("users").select("*")
      if (error) throw error
      // Also fetch roles to map role names when DB stores only role_id
  const { data: rolesData } = await supabaseAdmin.from("roles").select("*")
  const rolesMap: Record<number, Role | undefined> = {}
  // Normalize roles rows into typed Role entries conservatively
  ;((rolesData || []) as Array<Record<string, unknown>>).forEach((r) => {
    const id = Number(r["id"] ?? r["role_id"] ?? r["roleId"])
    if (!Number.isNaN(id)) {
      rolesMap[id] = {
        id,
        name: String(r["name"] ?? r["role_name"] ?? r["role"] ?? ""),
        description: String(r["description"] ?? ""),
      }
    }
  })

      const mapped = (data || []).map((row) => {
        const r = row as unknown as Record<string, unknown>
        const roleId = (r["role_id"] ?? r["roleId"]) as number | null | undefined
        const roleNameFromRow = (r["role_name"] ?? r["roleName"] ?? r["role"]) as string | undefined
        const roleName = roleNameFromRow ?? (roleId && rolesMap[roleId] ? rolesMap[roleId]!.name : "")
        return {
          id: r["id"] as number,
          username: (r["username"] ?? "") as string,
          email: (r["email"] ?? "") as string,
          firstName: (r["first_name"] ?? r["firstName"] ?? "") as string,
          lastName: (r["last_name"] ?? r["lastName"] ?? "") as string,
          roleId: (roleId ?? null) as number | null,
          roleName,
          isActive: (r["is_active"] ?? r["isActive"] ?? true) as boolean,
        }
      })
      return res.status(200).json(mapped)
    }

    if (req.method === "POST") {
  const payload = req.body as Record<string, unknown>
      // Accept camelCase from client, convert to snake_case for DB
      const dbPayload = {
        id: payload.id ?? undefined,
        username: payload.username,
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        role_id: payload.roleId,
        role_name: payload.roleName,
        is_active: payload.isActive,
        password: payload.password ?? "demo123",
      }
      // If DB schema doesn't provide auto-increment, compute an id = max(id)+1
      if (dbPayload.id === undefined || dbPayload.id === null) {
        const { data: lastRows, error: lastErr } = await supabaseAdmin
          .from("users")
          .select("id")
          .order("id", { ascending: false })
          .limit(1)
        if (lastErr) throw lastErr
        const lr = (lastRows as Array<Record<string, unknown>> | null) || []
        const maxId = lr.length > 0 ? Number(lr[0]["id"] ?? lr[0]["ID"] ?? 0) : 0
        dbPayload.id = maxId + 1
      }
      const { data, error } = await supabaseAdmin.from("users").insert(dbPayload).select().limit(1).single()
      if (error) throw error
      const row = data as unknown as Record<string, unknown>
      const mapped = {
        id: row["id"] as number,
        username: (row["username"] ?? "") as string,
        email: (row["email"] ?? "") as string,
        firstName: (row["first_name"] ?? row["firstName"] ?? "") as string,
        lastName: (row["last_name"] ?? row["lastName"] ?? "") as string,
        roleId: (row["role_id"] ?? row["roleId"] ?? null) as number | null,
        roleName: (row["role_name"] ?? row["roleName"] ?? row["role"] ?? "") as string,
        isActive: (row["is_active"] ?? row["isActive"] ?? true) as boolean,
      }
      return res.status(201).json(mapped)
    }

    if (req.method === "PUT") {
  const { id, ...updates } = req.body as Record<string, unknown>
      if (!id) return res.status(400).json({ error: "Missing id" })
      // convert camelCase updates to snake_case DB columns
  const dbUpdates: Record<string, unknown> = {}
  const updatesRec = updates as Record<string, unknown>
  if (updatesRec["username"] !== undefined) dbUpdates.username = updatesRec["username"]
  if (updatesRec["firstName"] !== undefined) dbUpdates.first_name = updatesRec["firstName"]
  if (updatesRec["lastName"] !== undefined) dbUpdates.last_name = updatesRec["lastName"]
  if (updatesRec["roleId"] !== undefined) dbUpdates.role_id = updatesRec["roleId"]
  if (updatesRec["roleName"] !== undefined) dbUpdates.role_name = updatesRec["roleName"]
  if (updatesRec["email"] !== undefined) dbUpdates.email = updatesRec["email"]
  if (updatesRec["isActive"] !== undefined) dbUpdates.is_active = updatesRec["isActive"]
  if (updatesRec["password"] !== undefined) dbUpdates.password = updatesRec["password"]

      const { data, error } = await supabaseAdmin.from("users").update(dbUpdates).eq("id", id).select().limit(1).single()
      if (error) throw error
      const row = data
      const mapped = {
        id: row.id,
        username: row.username,
        email: row.email,
        firstName: row.first_name ?? row.firstName ?? "",
        lastName: row.last_name ?? row.lastName ?? "",
        roleId: row.role_id ?? row.roleId ?? null,
        roleName: row.role_name ?? row.roleName ?? row.role ?? "",
        isActive: row.is_active ?? row.isActive ?? true,
      }
      return res.status(200).json(mapped)
    }

    if (req.method === "DELETE") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing id" })
      const userId = Number(id)
      // check for referencing rows in common tables
  const referencing: Record<string, unknown> = {}

      const checks = await Promise.all([
        supabaseAdmin.from("enrollments").select("id").eq("student_id", userId).limit(1),
        supabaseAdmin.from("grades").select("id").or(`student_id.eq.${userId},graded_by.eq.${userId}`).limit(1),
        supabaseAdmin.from("assignments").select("id").eq("teacher_id", userId).limit(1),
        supabaseAdmin.from("subjects").select("id").eq("teacher_id", userId).limit(1),
      ])

      if (checks[0].data && checks[0].data.length > 0) referencing.enrollments = true
      if (checks[1].data && checks[1].data.length > 0) referencing.grades = true
      if (checks[2].data && checks[2].data.length > 0) referencing.assignments = true
      if (checks[3].data && checks[3].data.length > 0) referencing.subjects = true

      const force = req.query.force === "true" || req.query.force === "1"

      if (!force && Object.keys(referencing).length > 0) {
        return res.status(409).json({ error: "User has dependent records", references: referencing })
      }

      // if force, delete dependent records first (in safe order)
      if (force) {
        // Fetch dependent IDs first so we can log and return a summary
        const [enrollResIds, gradesResIds, assignmentsResIds, subjectsResIds] = await Promise.all([
          supabaseAdmin.from("enrollments").select("id").eq("student_id", userId),
          supabaseAdmin.from("grades").select("id").or(`student_id.eq.${userId},graded_by.eq.${userId}`),
          supabaseAdmin.from("assignments").select("id").eq("teacher_id", userId),
          supabaseAdmin.from("subjects").select("id").eq("teacher_id", userId),
        ])

  const enrollIds = (enrollResIds.data || []).map((r) => (r as unknown as Record<string, unknown>)["id"] as number)
  const gradesIds = (gradesResIds.data || []).map((r) => (r as unknown as Record<string, unknown>)["id"] as number)
  const assignmentsIds = (assignmentsResIds.data || []).map((r) => (r as unknown as Record<string, unknown>)["id"] as number)
  const subjectsIds = (subjectsResIds.data || []).map((r) => (r as unknown as Record<string, unknown>)["id"] as number)

        const deletedCounts: Record<string, number> = {
          enrollments: 0,
          grades: 0,
          assignments: 0,
          subjects: 0,
        }
        const deletedIds: Record<string, number[]> = {
          enrollments: [],
          grades: [],
          assignments: [],
          subjects: [],
        }

        // Helper to delete by ids and capture result
        async function deleteByIds(table: string, ids: number[]) {
          if (!ids || ids.length === 0) return { count: 0, ids: [] }
          const { data, error } = await supabaseAdmin.from(table).delete().in("id", ids).select("id")
          if (error) throw error
          return { count: (data || []).length, ids: (data || []).map((d) => (d as unknown as Record<string, unknown>)["id"] as number) }
        }

        // perform deletions in order to respect FK relationships
        const enrollDel = await deleteByIds("enrollments", enrollIds)
        deletedCounts.enrollments = enrollDel.count
        deletedIds.enrollments = enrollDel.ids

        const gradesDel = await deleteByIds("grades", gradesIds)
        deletedCounts.grades = gradesDel.count
        deletedIds.grades = gradesDel.ids

        const assignmentsDel = await deleteByIds("assignments", assignmentsIds)
        deletedCounts.assignments = assignmentsDel.count
        deletedIds.assignments = assignmentsDel.ids

        const subjectsDel = await deleteByIds("subjects", subjectsIds)
        deletedCounts.subjects = subjectsDel.count
        deletedIds.subjects = subjectsDel.ids

        // Log structured info
        console.log(JSON.stringify({ action: "force-delete", userId, deletedCounts, deletedIds }))

        // After deleting dependents, delete the user
        const { error: userDelErr } = await supabaseAdmin.from("users").delete().eq("id", userId)
        if (userDelErr) throw userDelErr

        return res.status(200).json({ message: "User and dependent records deleted", deleted: deletedCounts, deletedIds })
      }

      const { error } = await supabaseAdmin.from("users").delete().eq("id", userId)
      if (error) throw error
      return res.status(204).end()
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: unknown) {
    console.error("admin/users error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: message || "Error interno" })
  }
}
