import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"

// Simulación de notas y lógica principal para el docente
const grades = [
  { student: 'Luis Torres', subject: 'Matemáticas', grade: 4.8, lastModified: '2025-10-09' },
  { student: 'María López', subject: 'Matemáticas', grade: 3.9, lastModified: '2025-10-08' },
];
const history = [
  { student: 'Luis Torres', action: 'edit', oldGrade: 4.5, newGrade: 4.8, date: '2025-10-09' },
];

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Ejemplo de registro, edición y visualización de notas
  res.status(200).json({
    message: 'Acceso concedido solo a docente',
    grades,
    history,
    average: grades.reduce((acc, g) => acc + g.grade, 0) / grades.length,
  });
}, ["teacher"]);
