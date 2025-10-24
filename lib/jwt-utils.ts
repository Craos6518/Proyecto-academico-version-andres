import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"
const JWT_EXPIRES_IN = "2h"

export interface JwtUser {
  id: number
  username: string
  role: string
}

export function generateJWT(user: JwtUser) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyJWT(token: string): null | { id: number; username: string; role: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string }
  } catch (err) {
    return null
  }
}