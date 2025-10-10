import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"

// Simulación de datos y lógica principal para el estudiante
const subjects = [
  { name: 'Matemáticas', grade: 4.8 },
  { name: 'Lengua', grade: 3.9 },
];
const messages = [
  { from: 'Ana Gómez', subject: 'Matemáticas', message: 'Buen trabajo en el último examen.' },
];

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Ejemplo de consulta de calificaciones y mensajes
  res.status(200).json({
    message: 'Acceso concedido solo a estudiante',
    subjects,
    average: subjects.reduce((acc, s) => acc + s.grade, 0) / subjects.length,
    messages,
    exportLinks: {
      csv: '/api/student/grades.csv',
      pdf: '/api/student/grades.pdf',
    },
  });
}, ["student"]);
