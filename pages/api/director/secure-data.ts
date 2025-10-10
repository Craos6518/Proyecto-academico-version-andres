import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"

// Simulación de reportes y lógica principal para el director
const academicReports = [
  {
    course: '10A',
    subject: 'Matemáticas',
    period: '2025-2',
    average: 4.2,
    students: 30,
  },
  {
    course: '10A',
    subject: 'Lengua',
    period: '2025-2',
    average: 4.0,
    students: 30,
  },
];
const teacherPerformance = [
  { teacher: 'Ana Gómez', subject: 'Matemáticas', average: 4.5 },
  { teacher: 'Carlos Ruiz', subject: 'Lengua', average: 4.1 },
];

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Ejemplo de reportes consolidados y supervisión docente
  res.status(200).json({
    message: 'Acceso concedido solo a director',
    academicReports,
    teacherPerformance,
    downloadLinks: {
      csv: '/api/director/report.csv',
      pdf: '/api/director/report.pdf',
    },
  });
}, ["director"]);
