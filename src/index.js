// MCP Server v3 — Spec 2026-07-28
// Cloudflare Workers + Pterodactyl Integration
// + Auto-approve OAuth (agar Claude mobile bisa connect tanpa web login)

import { generalTools, callGeneral } from './tools.js'
import { pterodactylTools, callPterodactyl } from './pterodactyl.js'

const allTools = [...generalTools, ...pterodactylTools]

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version, Accept'
}

// Token statis — semua request dianggap valid (no real auth)
const STATIC_TOKEN = 'mcp-auto-approved-token'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = `${url.protocol}//${url.host}`
    const clientIP = request.headers.get('CF-Connecting-IP') || ''

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    // ─── Health check ───────────────────────────────────────────
    if (url.pathname === '/') {
      return Response.json({
        status: 'online',
        version: '3.0.0',
        spec: '2026-07-28',
        tools: allTools.length,
        pterodactyl: { url: env.PTERO_URL, server: env.PTERO_SERVER }
      }, { headers: cors })
    }

    // ─── OAuth: Protected Resource Metadata ─────────────────────
    // Claude fetch ini pertama kali untuk tau siapa auth server-nya
    if (url.pathname === '/.well-known/oauth-protected-resource') {
      return Response.json({
        resource: origin,
        authorization_servers: [origin]
      }, { headers: cors })
    }

    // ─── OAuth: Authorization Server Metadata ───────────────────
    // Claude fetch ini untuk tau endpoint mana yang harus dipanggil
    if (url.pathname === '/.well-known/oauth-authorization-server') {
      return Response.json({
        issuer: origin,
        authorization_endpoint: `${origin}/authorize`,
        token_endpoint: `${origin}/token`,
        registration_endpoint: `${origin}/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none']
      }, { headers: cors })
    }

    // ─── OAuth: Dynamic Client Registration ─────────────────────
    // Claude register dirinya sebagai OAuth client
    if (request.method === 'POST' && url.pathname === '/register') {
      let body = {}
      try { body = await request.json() } catch {}
      const clientId = crypto.randomUUID()
      return Response.json({
        client_id: clientId,
        client_secret: 'no-secret',
        client_id_issued_at: Math.floor(Date.now() / 1000),
        redirect_uris: body.redirect_uris || [],
        grant_types: ['authorization_code'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none'
      }, { status: 201, headers: cors })
    }

    // ─── OAuth: Authorize — auto-approve tanpa interaksi user ───
    // Claude redirect user ke sini, langsung di-redirect balik ke claude.ai
    if (url.pathname === '/authorize') {
      const redirectUri = url.searchParams.get('redirect_uri')
      const state      = url.searchParams.get('state') || ''
      const code       = crypto.randomUUID()   // sekali pakai

      if (!redirectUri) {
        return new Response('Missing redirect_uri', { status: 400, headers: cors })
      }

      const callbackUrl = new URL(redirectUri)
      callbackUrl.searchParams.set('code', code)
      if (state) callbackUrl.searchParams.set('state', state)

      // Simpan code sementara di KV (pakai env.MCP_CACHE jika ada, atau skip)
      // Untuk versi simpel: code apapun diterima di /token
      return Response.redirect(callbackUrl.toString(), 302)
    }

    // ─── OAuth: Token Exchange ───────────────────────────────────
    // Claude tukar code → access_token
    if (request.method === 'POST' && url.pathname === '/token') {
      return Response.json({
        access_token: STATIC_TOKEN,
        token_type: 'Bearer',
        expires_in: 31536000   // 1 tahun
      }, { headers: cors })
    }

    // ─── MCP: GET /mcp — discovery ──────────────────────────────
    if (request.method === 'GET' && url.pathname === '/mcp') {
      return Response.json({
        name: 'mcp-server',
        version: '3.0.0',
        protocolVersion: '2026-07-28',
        capabilities: { tools: {} }
      }, { headers: cors })
    }

    // ─── MCP: DELETE /mcp — session end ─────────────────────────
    if (request.method === 'DELETE' && url.pathname === '/mcp') {
      return new Response(null, { status: 200, headers: cors })
    }

    // ─── MCP: POST /mcp — JSON-RPC 2.0 ──────────────────────────
    if (request.method === 'POST' && url.pathname === '/mcp') {
      let body
      try { body = await request.json() }
      catch { return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400, headers: cors }) }

      const { method, id, params } = body

      if (method === 'initialize') {
        return Response.json({
          jsonrpc: '2.0', id,
          result: {
            protocolVersion: '2026-07-28',
            capabilities: { tools: {} },
            serverInfo: { name: 'mcp-server', version: '3.0.0' }
          }
        }, { headers: cors })
      }

      if (method === 'notifications/initialized') return new Response(null, { status: 202, headers: cors })

      if (method === 'tools/list') {
        return Response.json({ jsonrpc: '2.0', id, result: { tools: allTools } }, { headers: cors })
      }

      if (method === 'tools/call') {
        const toolName = params?.name
        const toolArgs = params?.arguments || {}

        let result = await callGeneral(toolName, toolArgs, clientIP)
        if (result === null) result = await callPterodactyl(toolName, toolArgs, env)
        if (result === null) result = { isError: true, content: [{ type: 'text', text: `❌ Tool '${toolName}' tidak ditemukan.` }] }

        return Response.json({ jsonrpc: '2.0', id, result }, { headers: cors })
      }

      return Response.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } }, { headers: cors })
    }

    return new Response('Not Found', { status: 404, headers: cors })
  }
                                                          }
        
