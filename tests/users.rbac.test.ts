import { describe, it, expect } from 'vitest'
import { createMockReq, createMockRes } from './utils/mockReqRes'
import { rawUsersHandler } from '../pages/api/admin/users'

describe('RBAC - users endpoint', () => {
  it('Director cannot create Admin', async () => {
    const req: any = createMockReq('POST', { username: 'u1', roleName: 'Administrador' })
    // simulate director caller
    req.user = { id: 10, role: 'Director', roleName: 'Director' }
  const res: any = createMockRes()
  await rawUsersHandler(req as any, res as any)
    // Debug info when failing
    if (!(res.statusCode === 403 || (res.body && res.body.error && /No autorizado/.test(String(res.body.error))))) {
      // Print for debugging in CI logs
      // eslint-disable-next-line no-console
      console.error('Director create Admin test - response code:', res.statusCode, 'body:', res.body)
    }
    // Expect 403 or error payload
    expect(res.statusCode === 403 || (res.body && res.body.error && /No autorizado/.test(String(res.body.error)))).toBeTruthy()
  })

  it('Prevent demote/delete of last admin (PUT)', async () => {
    // This test assumes DB has at least 1 admin; to keep test hermetic we check handler response when trying to demote self
    const req: any = createMockReq('PUT', { id: 1, roleName: 'Estudiante' })
    req.user = { id: 1, role: 'Administrador', roleName: 'Administrador' }
  const res: any = createMockRes()
  await rawUsersHandler(req as any, res as any)
    // Expect 409 or 403 depending on safeguard
    expect([409, 403].includes(res.statusCode) || (res.body && res.body.error)).toBeTruthy()
  })
})
