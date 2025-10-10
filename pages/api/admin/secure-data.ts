import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"

function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as any).user
  res.status(200).json({
    message: `Acceso permitido para ${user.username} con rol ${user.role}`,
    user,
  })
}

// Solo permite acceso a usuarios con rol 'admin'
export default withAuth(handler, ["admin"])
