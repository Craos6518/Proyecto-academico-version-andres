"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService, type AuthUser } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersManagement } from "@/components/admin/users-management"
import { SubjectsManagement } from "@/components/admin/subjects-management"
import { EnrollmentsManagement } from "@/components/admin/enrollments-management"
import { Users, BookOpen, GraduationCap, BarChart3 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubjects: 0,
    totalStudents: 0,
    totalTeachers: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.roleName !== "Administrador") {
      router.push("/");
      return;
    }
    setUser(currentUser);
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats({
          totalUsers: data.totalUsers,
          totalSubjects: data.totalSubjects,
          totalStudents: data.totalStudents,
          totalTeachers: data.totalTeachers,
        });
      })
      .catch((err) => console.error("Failed to load stats", err));
  }, [router]);

  if (!isMounted || !user) return null;

  return (
    <DashboardLayout user={user} title="Panel de Administración">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Materias</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubjects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estudiantes</CardTitle>
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profesores</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            </CardContent>
          </Card>
        </div>
        {/* Management Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión del Sistema</CardTitle>
            <CardDescription>Administra usuarios, materias y configuraciones del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users">Usuarios</TabsTrigger>
                <TabsTrigger value="subjects">Materias</TabsTrigger>
                <TabsTrigger value="enrollments">Inscripciones</TabsTrigger>
              </TabsList>
              <TabsContent value="users" className="mt-6">
                <UsersManagement />
              </TabsContent>
              <TabsContent value="subjects" className="mt-6">
                <SubjectsManagement />
              </TabsContent>
              <TabsContent value="enrollments" className="mt-6">
                <EnrollmentsManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
