"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User, Role } from "@/lib/types"
import { Plus, Pencil, Trash2, Search, KeyRound, AlertCircle } from "lucide-react"
// removed unused import changeUserPassword
import { authService, normalizeRole } from "@/lib/auth"

export function UsersManagement() {
  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }
    if (!editingUser) {
      setPasswordError("No se pudo verificar el usuario actual");
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUser.id, password: newPassword })
      });
      if (!res.ok) throw new Error('Error actualizando contraseña');
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
      setPasswordError("");
    } catch (err) {
      console.error('Failed to change password', err);
      setPasswordError('Error al cambiar la contraseña');
    }
  };

  const handleDelete = async (userId: number) => {
    // Usar diálogo controlado en vez de window.confirm
    if (userId === 1) return;
    const u = users.find((x) => x.id === userId) || null
    setEditingUser(u)
    setDeleteCandidate(u)
    setIsDeleteDialogOpen(true)
  };
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<{
    cedula: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: number;
  }>({
    cedula: "",
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    roleId: 4,
  })
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const currentUser = authService.getCurrentUser()
  // Prefer explicit roleName fields (roleName or role_name). `role` textual column has been removed.
  // Use explicit roleName (provided by API) or role_name if present; do not rely on free-text `role` column.
  const currentRole = normalizeRole(currentUser?.roleName ?? (currentUser as any)?.role_name)
  const isDirector = currentRole === "director"
  const isAdmin = currentRole === "admin"

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => {
        const arr = (data || []) as Array<Record<string, unknown>>
        const mapped: User[] = arr.map((u) => ({
          id: Number(u['id'] ?? 0),
          username: String(u['username'] ?? u['email'] ?? ''),
          email: String(u['email'] ?? ''),
          firstName: (u['firstName'] ?? u['first_name'] ?? '') as string,
          lastName: (u['lastName'] ?? u['last_name'] ?? '') as string,
          roleId: Number(u['roleId'] ?? u['role_id'] ?? 0),
          roleName: String(u['roleName'] ?? u['role_name'] ?? ''),
          cedula: String(u['cedula'] ?? u['cedula_ci'] ?? ''),
        }))
        setUsers(mapped)
      })
      .catch((err) => console.error('Failed to load users', err))
  }

  const [availableRoles, setAvailableRoles] = useState<Role[]>([])

  useEffect(() => {
    fetch('/api/admin/roles')
      .then((r) => r.json())
      .then((data) => {
  const arr = (data || []) as Array<Record<string, unknown>>
  const mapped: Role[] = arr.map((r) => ({ id: Number(r['id'] ?? 0), name: String(r['name'] ?? ''), description: String(r['description'] ?? '') }))
  // If current user is not admin, hide the Administrador role from the selection
  const filtered = isAdmin ? mapped : mapped.filter((ro) => normalizeRole(ro.name) !== 'admin')
  setAvailableRoles(filtered)
      })
      .catch((err) => console.error('Failed to load roles', err))
  }, [isAdmin])

  const filteredUsers = users
  // Use roleName/role_name for role detection. `role` textual column removed.
  .filter((user) => !isDirector || normalizeRole(user.roleName ?? (user as any).role_name) !== "admin")
    .filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole =
        roleFilter === "all" || normalizeRole(user.roleName ?? (user as any).role_name) === normalizeRole(roleFilter)

      return matchesSearch && matchesRole
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  const role = availableRoles.find((r) => r.id === formData.roleId);
    if (!formData.cedula || String(formData.cedula).trim() === "") {
      alert('La cédula es obligatoria')
      return
    }
    // Validar formato de cédula: solo dígitos, entre 6 y 12 caracteres (ajustable)
    const cedulaNorm = String(formData.cedula).trim()
    const cedulaRe = /^[0-9]{6,12}$/
    if (!cedulaRe.test(cedulaNorm)) {
      alert('Cédula inválida. Debe contener solo dígitos y tener entre 6 y 12 caracteres.')
      return
    }
    const payload = {
      cedula: cedulaNorm,
      username: formData.username,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      roleId: formData.roleId,
      roleName: role?.name || "Estudiante",
      password: editingUser ? undefined : "demo123",
      isActive: true,
    };
    try {
      if (editingUser) {
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingUser.id, ...payload })
        });
        if (res.status === 403) {
          alert('No autorizado para realizar esta acción')
          return
        }
        if (res.status === 409) {
          const body = await res.json().catch(() => ({}))
          alert(body.error || 'Operación conflictiva (409)')
          return
        }
        if (!res.ok) throw new Error('Error actualizando usuario');
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.status === 403) {
          alert('No autorizado para crear este tipo de usuario')
          return
        }
        if (!res.ok) throw new Error('Error creando usuario');
      }
      loadUsers();
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el usuario');
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      cedula: (user as any).cedula ?? "",
      username: user.username,
      email: user.email ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      roleId: user.roleId ?? 4,
    });
    setIsDialogOpen(true);
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({
      cedula: "",
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      roleId: 4,
    })
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError("")
    setPasswordSuccess(false)
  }

  // Estado para confirmar eliminación usando Dialog
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  // If server replies 409, it includes references; store them to show UI and allow force
  const [deleteReferences, setDeleteReferences] = useState<Record<string, boolean> | null>(null)
  const [forceDelete, setForceDelete] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null)

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    setIsDeleting(true)
    try {
      const url = `/api/admin/users?id=${deleteCandidate.id}${forceDelete ? "&force=1" : ""}`
      const res = await fetch(url, {
        method: 'DELETE',
      })

      if (res.status === 409) {
        // Server indicates dependent records exist. Parse response to show details and allow force.
        const body = await res.json().catch(() => ({}))
        setDeleteReferences(body.references || null)
        setDeleteErrorMessage(body.error || 'User has dependent records')
        // keep dialog open so user can decide to force
        return
      }

      if (!res.ok) throw new Error('Error eliminando usuario')

      setIsDeleteDialogOpen(false)
      setDeleteCandidate(null)
      setDeleteReferences(null)
      setForceDelete(false)
      setDeleteErrorMessage(null)
      loadUsers()
      // mostrar feedback mínimo
      alert('Usuario eliminado correctamente')
    } catch (err) {
      console.error('Failed to delete user', err)
      alert('Error al eliminar el usuario')
    } finally {
      setIsDeleting(false)
    }
  }

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case "Administrador":
        return "destructive"
      case "Director":
        return "default"
      case "Profesor":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {availableRoles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Modifica los datos del usuario" : "Completa los datos del nuevo usuario"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula</Label>
                  <Input
                    id="cedula"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    required
                    placeholder="Número de cédula"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={formData.roleId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, roleId: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editingUser && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">Cambiar Contraseña</h3>
                          <p className="text-sm text-muted-foreground">
                            Establece una nueva contraseña para este usuario
                          </p>
                        </div>
                      </div>

                      {passwordError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{passwordError}</AlertDescription>
                        </Alert>
                      )}

                      {passwordSuccess && (
                        <Alert className="border-green-500 bg-green-50 text-green-900">
                          <AlertCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription>Contraseña actualizada correctamente</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repite la nueva contraseña"
                        />
                      </div>

                      <Button type="button" variant="secondary" onClick={handlePasswordChange} className="w-full">
                        <KeyRound className="w-4 h-4 mr-2" />
                        Actualizar Contraseña
                      </Button>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">{editingUser ? "Guardar Cambios" : "Crear Usuario"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) setDeleteCandidate(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              {deleteCandidate
                ? `Vas a eliminar al usuario "${deleteCandidate.username}". Esta acción no se puede deshacer.`
                : "¿Estás seguro de que quieres eliminar este usuario?"}
            </DialogDescription>
          </DialogHeader>

          {deleteReferences && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium">El usuario tiene registros dependientes:</p>
              <ul className="list-disc ml-5 text-sm mt-2">
                {Object.keys(deleteReferences).map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
              <div className="flex items-center gap-2 mt-3">
                <input
                  id="force-delete"
                  type="checkbox"
                  checked={forceDelete}
                  onChange={() => setForceDelete(!forceDelete)}
                />
                <label htmlFor="force-delete" className="text-sm">
                  Forzar eliminación (borra registros dependientes)
                </label>
              </div>
              {deleteErrorMessage && <p className="text-sm text-muted-foreground mt-2">{deleteErrorMessage}</p>}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setIsDeleteDialogOpen(false); setDeleteReferences(null); setForceDelete(false); }} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : deleteReferences ? (forceDelete ? "Eliminar y forzar" : "Eliminar") : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    {user.firstName ?? ""} {user.lastName ?? ""}
                  </TableCell>
                  <TableCell>{(user as any).cedula ?? ""}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.roleName ?? "")}>
                      {user.roleName ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
