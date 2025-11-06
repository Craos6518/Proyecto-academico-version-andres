import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import type { Role } from "../../../lib/types"
import { withAuth } from "../../../lib/middleware/auth"
import { normalizeRole } from "../../../lib/auth"

async function handler(req: NextApiRequest, res: NextApiResponse) {

  // Helper: count admins in users table using role_name/role fields and roles table
  async function countAdmins(): Promise<number> {
    try {
      // fetch roles to resolve admin role ids
      const { data: rolesData } = await supabaseAdmin.from("roles").select("id,name")
      const adminRoleIds: number[] = []
      ;((rolesData || []) as Array<Record<string, unknown>>).forEach((r) => {
        const name = String(r["name"] ?? "")
        if (normalizeRole(name) === "admin") {
          const id = Number(r["id"] ?? r["role_id"] ?? r["roleId"])
          if (!Number.isNaN(id)) adminRoleIds.push(id)
        }
      })

      // fetch users with potentially admin roles
      const { data: usersData } = await supabaseAdmin.from("users").select("id,role_id,role_name")
      let count = 0
      ;((usersData || []) as Array<Record<string, unknown>>).forEach((u) => {
        const rawRole = (u["role_name"] ?? u["roleName"]) as string | undefined
        const roleId = Number(u["role_id"] ?? u["roleId"] ?? 0)
        if (roleId && adminRoleIds.includes(roleId)) {
          count++
          return
        }
        if (rawRole && normalizeRole(rawRole) === "admin") {
          count++
        }
      })
      return count
    } catch (e) {
      console.error("countAdmins error", e)
      // On error be conservative and return a high number to avoid blocking operations.
      return 9999
    }
  }

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
        name: String(r["name"] ?? r["role_name"] ?? ""),
        description: String(r["description"] ?? ""),
      }
    }
  })

      const mapped = (data || []).map((row: Record<string, unknown>) => {
        const r = row as Record<string, unknown>
  const roleId = (r["role_id"] ?? r["roleId"]) as number | null | undefined
  const roleNameFromRow = (r["role_name"] ?? r["roleName"]) as string | undefined
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
          cedula: (r["cedula"] ?? r["cedula_ci"] ?? r["cedula_norm"] ?? "") as string,
        }
      })
      return res.status(200).json(mapped)
    }

    if (req.method === "POST") {
      const payload = req.body as Record<string, unknown>
      // authorization: ensure caller cannot create Admin unless they are admin
  const caller = (req as unknown as { user?: Record<string, unknown> }).user
  const callerRec = caller as Record<string, unknown> | undefined
  const rawCallerRole = callerRec && typeof callerRec["role"] === "string" ? String(callerRec["role"]) : callerRec && typeof callerRec["roleName"] === "string" ? String(callerRec["roleName"]) : undefined
  const callerRole = normalizeRole(rawCallerRole)
      // Determine intended role name from payload (roleName or roleId)
      let intendedRoleName: string | undefined = undefined
      if (payload.roleName) intendedRoleName = String(payload.roleName)
      if ((payload.roleId !== undefined && payload.roleId !== null) && !intendedRoleName) {
        // try to resolve role name from roles table
        try {
          const { data: roleRec } = await supabaseAdmin.from("roles").select("name").eq("id", payload.roleId).limit(1).maybeSingle()
          if (roleRec && (roleRec as Record<string, unknown>).name) intendedRoleName = String((roleRec as Record<string, unknown>).name)
        } catch {
          // ignore lookup errors; fall back to defensive check below
        }
      }
      if (intendedRoleName && normalizeRole(intendedRoleName) === "admin" && callerRole !== "admin") {
        return res.status(403).json({ error: "No autorizado para asignar rol Administrador" })
      }
      // Accept camelCase from client, convert to snake_case for DB
      // cedula is required
      if (!payload.cedula || String(payload.cedula).trim() === "") {
        return res.status(400).json({ error: "Missing cedula" })
      }

      const dbPayload = {
        cedula: String(payload.cedula).trim(),
        username: payload.username,
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        role_id: payload.roleId,
        role_name: payload.roleName,
        is_active: payload.isActive,
        password: payload.password ?? "demo123",
      }

      // Let the database assign `id` (auto-increment/identity). Do not compute or send id from the server.
      const { data, error } = await supabaseAdmin.from("users").insert(dbPayload).select().limit(1).single()
      if (error) {
        // Unique violation -> 409 Conflict
        if ((error as any).code === "23505" || (error.message && String(error.message).toLowerCase().includes("duplicate"))) {
          return res.status(409).json({ error: "Conflicto: cedula o campo único duplicado", detail: error.message })
        }
        throw error
      }
      const row = data as unknown as Record<string, unknown>
      const mapped = {
        id: row["id"] as number,
        username: (row["username"] ?? "") as string,
        email: (row["email"] ?? "") as string,
        firstName: (row["first_name"] ?? row["firstName"] ?? "") as string,
        lastName: (row["last_name"] ?? row["lastName"] ?? "") as string,
        roleId: (row["role_id"] ?? row["roleId"] ?? null) as number | null,
  roleName: (row["role_name"] ?? row["roleName"] ?? "") as string,
        isActive: (row["is_active"] ?? row["isActive"] ?? true) as boolean,
      }
      return res.status(201).json(mapped)
    }

    if (req.method === "PUT") {
      const { id, ...updates } = req.body as Record<string, unknown>
      // authorization: prevent non-admins from assigning Admin role via roleId/roleName
  const caller = (req as unknown as { user?: Record<string, unknown> }).user
  const callerRec = caller as Record<string, unknown> | undefined
  const rawCallerRole = callerRec && typeof callerRec["role"] === "string" ? String(callerRec["role"]) : callerRec && typeof callerRec["roleName"] === "string" ? String(callerRec["roleName"]) : undefined
  const callerRole = normalizeRole(rawCallerRole)
      if (!id) return res.status(400).json({ error: "Missing id" })
      // convert camelCase updates to snake_case DB columns
  const dbUpdates: Record<string, unknown> = {}
  const updatesRec = updates as Record<string, unknown>
  if (updatesRec["username"] !== undefined) dbUpdates.username = updatesRec["username"]
  if (updatesRec["firstName"] !== undefined) dbUpdates.first_name = updatesRec["firstName"]
  if (updatesRec["lastName"] !== undefined) dbUpdates.last_name = updatesRec["lastName"]
  if (updatesRec["roleId"] !== undefined) {
    // resolve roleId -> name and validate
    const newRoleId = updatesRec["roleId"]
    try {
      const { data: roleRec } = await supabaseAdmin.from("roles").select("name").eq("id", newRoleId).limit(1).maybeSingle()
      const newRoleName = roleRec && (roleRec as Record<string, unknown>).name ? String((roleRec as Record<string, unknown>).name) : undefined
      if (newRoleName && normalizeRole(newRoleName) === "admin" && callerRole !== "admin") {
        return res.status(403).json({ error: "No autorizado para asignar rol Administrador" })
      }
    } catch {
      // ignore lookup errors and continue defensively
    }
    dbUpdates.role_id = updatesRec["roleId"]
  }
  if (updatesRec["roleName"] !== undefined) {
    if (normalizeRole(String(updatesRec["roleName"])) === "admin" && callerRole !== "admin") {
      return res.status(403).json({ error: "No autorizado para asignar rol Administrador" })
    }
    dbUpdates.role_name = updatesRec["roleName"]
  }
  if (updatesRec["email"] !== undefined) dbUpdates.email = updatesRec["email"]
  if (updatesRec["cedula"] !== undefined) dbUpdates.cedula = String(updatesRec["cedula"]).trim()
  if (updatesRec["isActive"] !== undefined) dbUpdates.is_active = updatesRec["isActive"]
  if (updatesRec["password"] !== undefined) dbUpdates.password = updatesRec["password"]

      // LAST-ADMIN SAFEGUARD: prevent removing Admin role if this is the last admin
      try {
  const { data: existingUser } = await supabaseAdmin.from("users").select("id,role_id,role_name").eq("id", id).limit(1).maybeSingle()
  const rawCurrentRole = existingUser && ((existingUser as Record<string, unknown>).role_name ?? (existingUser as Record<string, unknown>).roleName) as string | undefined
        const currentIsAdmin = rawCurrentRole ? normalizeRole(rawCurrentRole) === "admin" : false

        // determine what the new role would be after update
        let newRoleName: string | undefined = undefined
        if (dbUpdates.role_name) newRoleName = String(dbUpdates.role_name)
        if ((dbUpdates.role_id !== undefined && dbUpdates.role_id !== null) && !newRoleName) {
          try {
            const { data: roleRec } = await supabaseAdmin.from("roles").select("name").eq("id", dbUpdates.role_id).limit(1).maybeSingle()
            if (roleRec && (roleRec as Record<string, unknown>).name) newRoleName = String((roleRec as Record<string, unknown>).name)
          } catch {
            // ignore
          }
        }
        const wouldRemainAdmin = newRoleName ? normalizeRole(newRoleName) === "admin" : currentIsAdmin

        // get caller id to detect self-demote
        const callerIdRaw = callerRec && (callerRec["id"] ?? callerRec["user_id"] ?? callerRec["sub"] ?? callerRec["uid"])
        const callerId = callerIdRaw ? Number(callerIdRaw) : undefined

        if (currentIsAdmin && !wouldRemainAdmin) {
          const adminsCount = await countAdmins()
          if (adminsCount <= 1) {
            return res.status(409).json({ error: "No es posible eliminar o desasignar el rol Administrador: este usuario es el último administrador" })
          }
          // additionally prevent self-demote even if there are other admins? allow if >1 but avoid accidental self-demote
          if (callerId !== undefined && callerId === Number(id)) {
            return res.status(403).json({ error: "No puedes desasignarte el rol Administrador desde esta acción" })
          }
        }
      } catch (e) {
        // if safeguard check fails unexpectedly, log and continue defensively (do not block update unless we can confirm last-admin)
        console.error("last-admin safeguard check failed:", e)
      }

      const { data, error } = await supabaseAdmin.from("users").update(dbUpdates).eq("id", id).select().limit(1).single()
      if (error) {
        if ((error as any).code === "23505" || (error.message && String(error.message).toLowerCase().includes("duplicate"))) {
          return res.status(409).json({ error: "Conflicto: cedula o campo único duplicado", detail: error.message })
        }
        throw error
      }
      const row = data
      const mapped = {
        id: row.id,
        username: row.username,
        email: row.email,
        firstName: row.first_name ?? row.firstName ?? "",
        lastName: row.last_name ?? row.lastName ?? "",
        roleId: row.role_id ?? row.roleId ?? null,
  roleName: row.role_name ?? row.roleName ?? "",
        isActive: row.is_active ?? row.isActive ?? true,
      }
      return res.status(200).json(mapped)
    }

    if (req.method === "DELETE") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing id" })
      const userId = Number(id)
      // authorization: only admin can force-delete or delete another admin
  const caller = (req as unknown as { user?: Record<string, unknown> }).user
  const callerRec = caller as Record<string, unknown> | undefined
  const rawCallerRole = callerRec && typeof callerRec["role"] === "string" ? String(callerRec["role"]) : callerRec && typeof callerRec["roleName"] === "string" ? String(callerRec["roleName"]) : undefined
  const callerRole = normalizeRole(rawCallerRole)
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

      // If attempting force-delete, only admin allowed
      if (force && callerRole !== "admin") {
        return res.status(403).json({ error: "No autorizado para eliminar forzosamente usuarios" })
      }

      // Prevent deletion of users with Admin role by non-admin callers, and prevent deleting the last admin
      try {
  const { data: targetUser } = await supabaseAdmin.from("users").select("id,role_id,role_name").eq("id", userId).limit(1).maybeSingle()
  const rawRole = (targetUser && ((targetUser as Record<string, unknown>).role_name ?? (targetUser as Record<string, unknown>).roleName)) as string | undefined
        if (rawRole && normalizeRole(rawRole) === "admin") {
          if (callerRole !== "admin") {
            return res.status(403).json({ error: "No autorizado para eliminar usuarios con rol Administrador" })
          }
          const adminsCount = await countAdmins()
          if (adminsCount <= 1) {
            return res.status(409).json({ error: "No es posible eliminar este Administrador: es el último usuario con rol Administrador" })
          }
        }
      } catch (e) {
        console.error("delete admin check error", e)
        // if we can't determine role safely, err on the side of safety and prevent deletion when caller isn't admin
        if (callerRole !== "admin") return res.status(403).json({ error: "No autorizado para eliminar usuarios con rol Administrador" })
      }

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

  const enrollIds = (enrollResIds.data || []).map((r: Record<string, unknown>) => (r as Record<string, unknown>)["id"] as number)
  const gradesIds = (gradesResIds.data || []).map((r: Record<string, unknown>) => (r as Record<string, unknown>)["id"] as number)
  const assignmentsIds = (assignmentsResIds.data || []).map((r: Record<string, unknown>) => (r as Record<string, unknown>)["id"] as number)
  const subjectsIds = (subjectsResIds.data || []).map((r: Record<string, unknown>) => (r as Record<string, unknown>)["id"] as number)

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
          return { count: (data || []).length, ids: (data || []).map((d: Record<string, unknown>) => (d as Record<string, unknown>)["id"] as number) }
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

export default withAuth(handler, ["admin", "director"])

// Export the raw handler (unwrapped) for unit tests to call directly
export { handler as rawUsersHandler }
