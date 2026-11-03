// MCP Server v3 — Spec 2026-07-28
// Cloudflare Workers + Pterodactyl Integration

import { generalTools, callGeneral } from './tools.js'
import { pterodactylTools, callPterodactyl } from './pterodactyl.js'

const allTools = [...generalTools, ...pterodactylTools]

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version, Accept'
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const clientIP = request.headers.get('CF-Connecting-IP') || ''

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    // Health check
    if (url.pathname === '/') {
      return Response.json({
        status: 'online',
        version: '3.0.0',
        spec: '2026-07-28',
        tools: allTools.length,
        pterodactyl: { url: env.PTERO_URL, server: env.PTERO_SERVER }
      }, { headers: cors })
    }

    // GET /mcp — discovery
    if (request.method === 'GET' && url.pathname === '/mcp') {
      return Response.json({
        name: 'mcp-server',
        version: '3.0.0',
        protocolVersion: '2026-07-28',
        capabilities: { tools: {} }
      }, { headers: cors })
    }

    // DELETE /mcp — session end
    if (request.method === 'DELETE' && url.pathname === '/mcp') {
      return new Response(null, { status: 200, headers: cors })
    }

    // POST /mcp — JSON-RPC 2.0
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

        // coba general tools dulu
        let result = await callGeneral(toolName, toolArgs, clientIP)

        // kalau null (tidak ditemukan di general) — coba pterodactyl
        if (result === null) result = await callPterodactyl(toolName, toolArgs, env)

        // kalau masih null — tool tidak ada
        if (result === null) result = { isError: true, content: [{ type: 'text', text: `❌ Tool '${toolName}' tidak ditemukan.` }] }

        return Response.json({ jsonrpc: '2.0', id, result }, { headers: cors })
      }

      return Response.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } }, { headers: cors })
    }

    return new Response('Not Found', { status: 404, headers: cors })
  }
        }
