import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin.from("users").select("*")
      if (error) throw error
      // Also fetch roles to map role names when DB stores only role_id
      const { data: rolesData } = await supabaseAdmin.from("roles").select("*")
      const rolesMap: Record<number, any> = {}
      ;(rolesData || []).forEach((r: any) => (rolesMap[r.id] = r))

      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        firstName: row.first_name ?? row.firstName ?? "",
        lastName: row.last_name ?? row.lastName ?? "",
        roleId: row.role_id ?? row.roleId ?? null,
        roleName:
          row.role_name ?? row.roleName ?? row.role ?? (rolesMap[row.role_id] ? rolesMap[row.role_id].name : ""),
        isActive: row.is_active ?? row.isActive ?? true,
      }))
      return res.status(200).json(mapped)
    }

    if (req.method === "POST") {
      const payload = req.body
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
      const { data, error } = await supabaseAdmin.from("users").insert(dbPayload).select().limit(1).single()
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
      return res.status(201).json(mapped)
    }

    if (req.method === "PUT") {
      const { id, ...updates } = req.body
      if (!id) return res.status(400).json({ error: "Missing id" })
      // convert camelCase updates to snake_case DB columns
      const dbUpdates: any = {}
      if (updates.username !== undefined) dbUpdates.username = updates.username
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName
      if (updates.roleId !== undefined) dbUpdates.role_id = updates.roleId
      if (updates.roleName !== undefined) dbUpdates.role_name = updates.roleName
      if (updates.email !== undefined) dbUpdates.email = updates.email
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
      if (updates.password !== undefined) dbUpdates.password = updates.password

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
      const { error } = await supabaseAdmin.from("users").delete().eq("id", Number(id))
      if (error) throw error
      return res.status(204).end()
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: any) {
    console.error("admin/users error:", err)
    return res.status(500).json({ error: err.message || "Error interno" })
  }
}
