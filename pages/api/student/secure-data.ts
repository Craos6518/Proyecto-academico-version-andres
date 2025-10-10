import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"

function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as any).user
  res.status(200).json({
    message: `Acceso permitido para ${user.username} con rol ${user.role}`,
    user,
  })
}

export default withAuth(handler, ["estudiante"])
