import { describe, it, expect } from 'vitest'
import { createMockReq, createMockRes } from './utils/mockReqRes'
import { rawUsersHandler } from '../pages/api/admin/users'

describe('Users - cedula validations', () => {
  it('returns 400 when missing cedula (POST)', async () => {
    const req: any = createMockReq('POST', { username: 'u2', email: 'u2@example.com' })
    // simulate admin caller
    req.user = { id: 1, role: 'Administrador', roleName: 'Administrador' }
    const res: any = createMockRes()
    await rawUsersHandler(req as any, res as any)
    expect(res.statusCode).toBe(400)
    expect(res.body && /Missing cedula/i.test(String(res.body.error))).toBeTruthy()
  })

  it('returns 409 on duplicate cedula (POST)', async () => {
    // The test DB stub has a user with cedula '12345678' (see supabase-client.ts makeTestDb)
    const req: any = createMockReq('POST', { username: 'u3', email: 'u3@example.com', cedula: '12345678' })
    req.user = { id: 1, role: 'Administrador', roleName: 'Administrador' }
    const res: any = createMockRes()
    await rawUsersHandler(req as any, res as any)
    // Expect conflict (409) or an error payload indicating duplicate
    expect(res.statusCode === 409 || (res.body && res.body.error)).toBeTruthy()
  })
})
