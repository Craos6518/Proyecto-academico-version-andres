import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"

// Simulación de datos y lógica principal para el administrador
const users = [
  { id: 1, name: 'Juan Pérez', role: 'admin' },
  { id: 2, name: 'Ana Gómez', role: 'teacher' },
  { id: 3, name: 'Luis Torres', role: 'student' },
];
const subjects = [
  { id: 1, name: 'Matemáticas' },
  { id: 2, name: 'Lengua' },
];
const logs = [
  { id: 1, action: 'login', user: 'Juan Pérez', date: '2025-10-10' },
  { id: 2, action: 'edit-grade', user: 'Ana Gómez', date: '2025-10-09' },
];

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Ejemplo de gestión: retornar usuarios, asignaturas y logs
  res.status(200).json({
    message: 'Acceso concedido solo a administrador',
    users,
    subjects,
    logs,
    stats: {
      totalUsers: users.length,
      totalSubjects: subjects.length,
      totalLogs: logs.length,
    },
  });
}, ["admin"]);
function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as any).user
  res.status(200).json({
    message: `Acceso permitido para ${user.username} con rol ${user.role}`,
    user,
  })
}

// Solo permite acceso a usuarios con rol 'admin'
