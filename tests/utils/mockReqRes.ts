import type { IncomingMessage, ServerResponse } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next'

export function createMockReq(method = 'GET', body: any = undefined): Partial<NextApiRequest> & IncomingMessage {
  const req: any = {
    method,
    query: {},
    body,
    headers: {},
    cookies: {},
    // allow assigning user for middleware-less invocation
    user: undefined,
  }
  return req
}

export function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code: number) { this.statusCode = code; return this },
    json(payload: any) { this.body = payload; return this },
    end() { return this },
  }
  return res as Partial<NextApiResponse> & ServerResponse
}
