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
import { changeUserPassword } from "@/lib/actions/password"
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
    if (userId === 1) return;
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error eliminando usuario');
      loadUsers();
      alert('Usuario eliminado correctamente');
    } catch (err) {
      console.error('Failed to delete user', err);
      alert('Error al eliminar el usuario');
    }
  };
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<{
    id: number | undefined;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: number;
  }>({
    id: undefined,
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
  const isDirector = normalizeRole(currentUser?.role ?? currentUser?.roleName) === "director"

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => setUsers(data || []))
      .catch((err) => console.error('Failed to load users', err))
  }

  const [availableRoles, setAvailableRoles] = useState<Role[]>([])

  useEffect(() => {
    fetch('/api/admin/roles')
      .then((r) => r.json())
      .then((data) => setAvailableRoles(data || []))
      .catch((err) => console.error('Failed to load roles', err))
  }, [])

  const filteredUsers = users
    .filter((user) => !isDirector || normalizeRole(user.role ?? user.roleName) !== "admin")
    .filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole =
        roleFilter === "all" || normalizeRole(user.role ?? user.roleName) === normalizeRole(roleFilter)

      return matchesSearch && matchesRole
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  const role = availableRoles.find((r) => r.id === formData.roleId);
    const payload = {
      ...formData,
      roleName: role?.name || "Estudiante",
      password: editingUser ? undefined : "demo123",
      isActive: true,
    };
    try {
      if (editingUser) {
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Error actualizando usuario');
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
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
      id: user.id,
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
      id: undefined,
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
                  <Label htmlFor="id">ID</Label>
                  <Input
                    id="id"
                    type="number"
                    value={formData.id ?? ""}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value === "" ? undefined : Number(e.target.value) })}
                    placeholder="ID único (entero)"
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

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
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
