// ============================================================
// GENERAL TOOLS — Utility, Konversi, Generator, dll
// ============================================================

export const generalTools = [
  { name: 'ping', description: 'Test koneksi ke MCP server', inputSchema: { type: 'object', properties: {}, required: [] } },
  {
    name: 'waktu',
    description: 'Waktu sekarang (WIB/WITA/WIT/UTC)',
    inputSchema: {
      type: 'object',
      properties: { zona: { type: 'string', description: 'wib | wita | wit | utc (default: wib)' } },
      required: []
    }
  },
  { name: 'echo', description: 'Balikkan pesan', inputSchema: { type: 'object', properties: { pesan: { type: 'string' } }, required: ['pesan'] } },
  { name: 'base64_encode', description: 'Encode teks ke Base64', inputSchema: { type: 'object', properties: { teks: { type: 'string' } }, required: ['teks'] } },
  { name: 'base64_decode', description: 'Decode Base64 ke teks', inputSchema: { type: 'object', properties: { base64: { type: 'string' } }, required: ['base64'] } },
  { name: 'url_encode', description: 'URL encode teks', inputSchema: { type: 'object', properties: { teks: { type: 'string' } }, required: ['teks'] } },
  { name: 'url_decode', description: 'URL decode teks', inputSchema: { type: 'object', properties: { teks: { type: 'string' } }, required: ['teks'] } },
  { name: 'json_format', description: 'Pretty-print JSON', inputSchema: { type: 'object', properties: { json: { type: 'string' } }, required: ['json'] } },
  { name: 'json_minify', description: 'Minify JSON', inputSchema: { type: 'object', properties: { json: { type: 'string' } }, required: ['json'] } },
  { name: 'uuid', description: 'Generate UUID v4', inputSchema: { type: 'object', properties: { jumlah: { type: 'number' } }, required: [] } },
  { name: 'random_number', description: 'Angka random', inputSchema: { type: 'object', properties: { min: { type: 'number' }, max: { type: 'number' } }, required: [] } },
  { name: 'random_string', description: 'String random', inputSchema: { type: 'object', properties: { panjang: { type: 'number' }, tipe: { type: 'string' } }, required: [] } },
  { name: 'hash', description: 'SHA-256 / SHA-1 hash', inputSchema: { type: 'object', properties: { teks: { type: 'string' }, algoritma: { type: 'string' } }, required: ['teks'] } },
  { name: 'kalkulator', description: 'Hitung ekspresi matematika', inputSchema: { type: 'object', properties: { ekspresi: { type: 'string' } }, required: ['ekspresi'] } },
  { name: 'konversi_satuan', description: 'Konversi suhu/panjang/berat/kecepatan', inputSchema: { type: 'object', properties: { nilai: { type: 'number' }, dari: { type: 'string' }, ke: { type: 'string' } }, required: ['nilai', 'dari', 'ke'] } },
  { name: 'string_info', description: 'Analisis string', inputSchema: { type: 'object', properties: { teks: { type: 'string' } }, required: ['teks'] } },
  { name: 'string_reverse', description: 'Balik string', inputSchema: { type: 'object', properties: { teks: { type: 'string' } }, required: ['teks'] } },
  { name: 'slug', description: 'Convert ke URL slug', inputSchema: { type: 'object', properties: { teks: { type: 'string' } }, required: ['teks'] } },
  { name: 'parse_url', description: 'Parse komponen URL', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
  { name: 'ip_info', description: 'Info lokasi IP address', inputSchema: { type: 'object', properties: { ip: { type: 'string' } }, required: [] } },
  { name: 'http_get', description: 'HTTP GET request', inputSchema: { type: 'object', properties: { url: { type: 'string' }, headers: { type: 'object' } }, required: ['url'] } }
]

export async function callGeneral(name, args, clientIP) {
  switch (name) {
    case 'ping': return ok('✅ pong! MCP server aktif.')

    case 'waktu': {
      const zonaMap = { wib: 'Asia/Jakarta', wita: 'Asia/Makassar', wit: 'Asia/Jayapura', utc: 'UTC' }
      const zona = zonaMap[(args.zona || 'wib').toLowerCase()] || 'Asia/Jakarta'
      const label = (args.zona || 'WIB').toUpperCase()
      const fmt = new Intl.DateTimeFormat('id-ID', { timeZone: zona, dateStyle: 'full', timeStyle: 'long' }).format(new Date())
      return ok(`🕐 Waktu (${label}): ${fmt}`)
    }

    case 'echo': return ok(`🔁 ${args.pesan}`)

    case 'base64_encode': return ok(`🔒 ${btoa(unescape(encodeURIComponent(args.teks)))}`)

    case 'base64_decode': {
      try { return ok(`🔓 ${decodeURIComponent(escape(atob(args.base64)))}`) }
      catch { return err('Base64 tidak valid.') }
    }

    case 'url_encode': return ok(`🔗 ${encodeURIComponent(args.teks)}`)

    case 'url_decode': {
      try { return ok(`🔗 ${decodeURIComponent(args.teks)}`) }
      catch { return err('URL string tidak valid.') }
    }

    case 'json_format': {
      try { return ok(`\`\`\`json\n${JSON.stringify(JSON.parse(args.json), null, 2)}\n\`\`\``) }
      catch (e) { return err(`JSON tidak valid: ${e.message}`) }
    }

    case 'json_minify': {
      try { return ok(JSON.stringify(JSON.parse(args.json))) }
      catch (e) { return err(`JSON tidak valid: ${e.message}`) }
    }

    case 'uuid': {
      const n = Math.min(args.jumlah || 1, 10)
      const uuids = []
      for (let i = 0; i < n; i++) {
        const b = new Uint8Array(16)
        crypto.getRandomValues(b)
        b[6] = (b[6] & 0x0f) | 0x40
        b[8] = (b[8] & 0x3f) | 0x80
        const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('')
        uuids.push(`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`)
      }
      return ok(uuids.join('\n'))
    }

    case 'random_number': {
      const min = args.min ?? 0, max = args.max ?? 100
      return ok(`${Math.floor(Math.random() * (max - min + 1)) + min}`)
    }

    case 'random_string': {
      const len = Math.min(args.panjang || 16, 64)
      const sets = { alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', numeric: '0123456789', hex: '0123456789abcdef' }
      const cs = sets[args.tipe] || sets.alphanumeric
      const b = new Uint8Array(len)
      crypto.getRandomValues(b)
      return ok([...b].map(x => cs[x % cs.length]).join(''))
    }

    case 'hash': {
      const algo = { sha256: 'SHA-256', sha1: 'SHA-1' }[(args.algoritma || 'sha256').toLowerCase()]
      if (!algo) return err('Gunakan: sha256 | sha1')
      const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(args.teks))
      return ok([...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join(''))
    }

    case 'kalkulator': {
      try {
        const safe = args.ekspresi.replace(/[^0-9+\-*/.%()\s^]/g, '').replace(/\^/g, '**')
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${safe})`)()
        if (!isFinite(result)) return err('Hasil tidak valid.')
        return ok(`${args.ekspresi} = ${result}`)
      } catch (e) { return err(e.message) }
    }

    case 'konversi_satuan': {
      const { nilai, dari, ke } = args
      const d = dari.toLowerCase(), k = ke.toLowerCase()
      if (['c','f','k'].includes(d) && ['c','f','k'].includes(k)) {
        let c = d === 'c' ? nilai : d === 'f' ? (nilai-32)*5/9 : nilai-273.15
        const r = k === 'c' ? c : k === 'f' ? c*9/5+32 : c+273.15
        return ok(`${nilai}${d.toUpperCase()} = ${r.toFixed(4)} ${k.toUpperCase()}`)
      }
      const tables = { panjang: {km:1000,m:1,cm:0.01,mm:0.001,mi:1609.344,ft:0.3048}, berat: {kg:1000,g:1,mg:0.001,lb:453.592,oz:28.3495}, kecepatan: {kmh:1/3.6,mph:0.44704,ms:1} }
      for (const t of Object.values(tables)) {
        if (t[d] !== undefined && t[k] !== undefined) return ok(`${nilai} ${d} = ${(nilai * t[d] / t[k]).toFixed(6)} ${k}`)
      }
      return err(`Konversi '${d}' → '${k}' tidak didukung.`)
    }

    case 'string_info': {
      const t = args.teks
      return ok(`Karakter: ${t.length}\nKata: ${t.trim().split(/\s+/).filter(Boolean).length}\nBaris: ${t.split('\n').length}\nUnik: ${new Set(t).size}\nAngka: ${(t.match(/\d/g)||[]).length}\nSpasi: ${(t.match(/ /g)||[]).length}`)
    }

    case 'string_reverse': return ok(args.teks.split('').reverse().join(''))

    case 'slug': return ok(args.teks.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-'))

    case 'parse_url': {
      try {
        const u = new URL(args.url)
        const params = {}
        u.searchParams.forEach((v,k) => { params[k] = v })
        return ok(JSON.stringify({ protocol: u.protocol, host: u.host, pathname: u.pathname, search: u.search, hash: u.hash, params }, null, 2))
      } catch { return err('URL tidak valid.') }
    }

    case 'ip_info': {
      try {
        const target = args.ip || clientIP || ''
        const res = await fetch(`https://ipapi.co/${target}/json/`, { headers: { 'User-Agent': 'mcp-server/3.0' } })
        const d = await res.json()
        if (d.error) return err(d.reason)
        return ok(`IP: ${d.ip}\nNegara: ${d.country_name}\nKota: ${d.city}, ${d.region}\nISP: ${d.org}\nTimezone: ${d.timezone}\nKoordinat: ${d.latitude}, ${d.longitude}`)
      } catch (e) { return err(e.message) }
    }

    case 'http_get': {
      try {
        const res = await fetch(args.url, { method: 'GET', headers: { 'User-Agent': 'mcp-server/3.0', ...(args.headers || {}) } })
        const ct = res.headers.get('content-type') || ''
        const body = ct.includes('json') ? JSON.stringify(await res.json(), null, 2) : (await res.text()).slice(0, 2000)
        return ok(`Status: ${res.status}\n\n${body}`)
      } catch (e) { return err(e.message) }
    }

    default: return null
  }
}

function ok(text) { return { isError: false, content: [{ type: 'text', text }] } }
function err(text) { return { isError: true, content: [{ type: 'text', text: `❌ ${text}` }] } }
