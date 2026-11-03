// ============================================================
// PTERODACTYL TOOLS — Client API v1
// Endpoint: /api/client/servers/{server}/*
// ============================================================

export const pterodactylTools = [
  {
    name: 'ptero_server_info',
    description: 'Ambil detail info server Pterodactyl (nama, node, limits, dll)',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'ptero_server_status',
    description: 'Cek status & resource usage server (CPU, RAM, Disk, State)',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'ptero_power',
    description: 'Kontrol power server: start | stop | restart | kill',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'start | stop | restart | kill'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'ptero_send_command',
    description: 'Kirim command ke console server',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Command yang dikirim ke console server'
        }
      },
      required: ['command']
    }
  },
  {
    name: 'ptero_list_files',
    description: 'Lihat daftar file & folder di server',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Path direktori (default: /)'
        }
      },
      required: []
    }
  },
  {
    name: 'ptero_read_file',
    description: 'Baca isi file di server',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'Path file, contoh: /index.js'
        }
      },
      required: ['file']
    }
  },
  {
    name: 'ptero_write_file',
    description: 'Tulis / update isi file di server',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'Path file, contoh: /index.js'
        },
        content: {
          type: 'string',
          description: 'Konten baru file'
        }
      },
      required: ['file', 'content']
    }
  },
  {
    name: 'ptero_delete_file',
    description: 'Hapus file atau folder di server',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array path file yang dihapus, contoh: ["/old.js", "/temp/"]'
        }
      },
      required: ['files']
    }
  },
  {
    name: 'ptero_rename_file',
    description: 'Rename atau pindah file di server',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Path file asal' },
        to: { type: 'string', description: 'Path file tujuan / nama baru' }
      },
      required: ['from', 'to']
    }
  },
  {
    name: 'ptero_create_folder',
    description: 'Buat folder baru di server',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path folder yang dibuat, contoh: /newfolder' }
      },
      required: ['path']
    }
  },
  {
    name: 'ptero_list_backups',
    description: 'Lihat daftar backup server',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'ptero_create_backup',
    description: 'Buat backup baru server',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nama backup (opsional)' },
        locked: { type: 'boolean', description: 'Kunci backup agar tidak bisa dihapus (default: false)' }
      },
      required: []
    }
  },
  {
    name: 'ptero_server_activity',
    description: 'Lihat activity log server (siapa ngapain, kapan)',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'ptero_list_all_servers',
    description: 'Lihat semua server yang ada di akun panel kamu',
    inputSchema: { type: 'object', properties: {}, required: [] }
  }
]

// ============================================================
// HANDLER — logic Pterodactyl API calls
// ============================================================

async function pteroFetch(env, method, path, body = null) {
  const url = `${env.PTERO_URL}/api/client${path}`
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${env.PTERO_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(url, opts)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  return { status: res.status, ok: res.ok, data }
}

export async function callPterodactyl(name, args, env) {
  const srv = env.PTERO_SERVER

  try {
    switch (name) {

      case 'ptero_server_info': {
        const r = await pteroFetch(env, 'GET', `/servers/${srv}`)
        if (!r.ok) return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
        const s = r.data.attributes
        return ok(`🖥️ Server Info:
• Nama: ${s.name}
• Identifier: ${s.identifier}
• UUID: ${s.uuid}
• Node: ${s.node}
• Status: ${s.status || 'unknown'}
• RAM Limit: ${s.limits?.memory} MB
• CPU Limit: ${s.limits?.cpu}%
• Disk Limit: ${s.limits?.disk} MB
• Swap: ${s.limits?.swap} MB
• Database: ${s.feature_limits?.databases}
• Backup: ${s.feature_limits?.backups}`)
      }

      case 'ptero_server_status': {
        const r = await pteroFetch(env, 'GET', `/servers/${srv}/resources`)
        if (!r.ok) return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
        const s = r.data.attributes
        const cpu = s.resources?.cpu_absolute?.toFixed(2) || '0'
        const ram = ((s.resources?.memory_bytes || 0) / 1024 / 1024).toFixed(2)
        const disk = ((s.resources?.disk_bytes || 0) / 1024 / 1024).toFixed(2)
        const netRx = ((s.resources?.network?.rx_bytes || 0) / 1024).toFixed(2)
        const netTx = ((s.resources?.network?.tx_bytes || 0) / 1024).toFixed(2)
        return ok(`📊 Server Status:
• State: ${s.current_state}
• CPU: ${cpu}%
• RAM: ${ram} MB
• Disk: ${disk} MB
• Network In: ${netRx} KB
• Network Out: ${netTx} KB
• Suspended: ${s.is_suspended ? 'Ya' : 'Tidak'}`)
      }

      case 'ptero_power': {
        const allowed = ['start', 'stop', 'restart', 'kill']
        const action = args.action?.toLowerCase()
        if (!allowed.includes(action)) return err(`Action tidak valid. Gunakan: ${allowed.join(' | ')}`)
        const r = await pteroFetch(env, 'POST', `/servers/${srv}/power`, { signal: action })
        if (r.status === 204) return ok(`⚡ Power action '${action}' berhasil dikirim ke server.`)
        return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
      }

      case 'ptero_send_command': {
        const r = await pteroFetch(env, 'POST', `/servers/${srv}/command`, { command: args.command })
        if (r.status === 204) return ok(`✅ Command berhasil dikirim:\n> ${args.command}`)
        return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
      }

      case 'ptero_list_files': {
        const dir = args.directory || '/'
        const r = await pteroFetch(env, 'GET', `/servers/${srv}/files/list?directory=${encodeURIComponent(dir)}`)
        if (!r.ok) return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
        const files = r.data.data || []
        if (files.length === 0) return ok(`📁 Direktori '${dir}' kosong.`)
        const list = files.map(f => {
          const a = f.attributes
          const size = a.is_file ? ` (${(a.size / 1024).toFixed(1)} KB)` : '/'
          return `${a.is_file ? '📄' : '📁'} ${a.name}${size}`
        }).join('\n')
        return ok(`📁 Isi direktori '${dir}':\n${list}`)
      }

      case 'ptero_read_file': {
        const url = `${env.PTERO_URL}/api/client/servers/${srv}/files/contents?file=${encodeURIComponent(args.file)}`
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${env.PTERO_KEY}`,
            'Accept': 'text/plain'
          }
        })
        if (!res.ok) return err(`API error ${res.status}`)
        const content = await res.text()
        const preview = content.slice(0, 3000) + (content.length > 3000 ? '\n\n...(terpotong, terlalu panjang)' : '')
        return ok(`📄 Isi file '${args.file}':\n\`\`\`\n${preview}\n\`\`\``)
      }

      case 'ptero_write_file': {
        const url = `${env.PTERO_URL}/api/client/servers/${srv}/files/write?file=${encodeURIComponent(args.file)}`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.PTERO_KEY}`,
            'Content-Type': 'text/plain'
          },
          body: args.content
        })
        if (res.status === 204) return ok(`✅ File '${args.file}' berhasil ditulis.`)
        return err(`API error ${res.status}`)
      }

      case 'ptero_delete_file': {
        const r = await pteroFetch(env, 'POST', `/servers/${srv}/files/delete`, {
          root: '/',
          files: args.files
        })
        if (r.status === 204) return ok(`🗑️ File berhasil dihapus:\n${args.files.join('\n')}`)
        return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
      }

      case 'ptero_rename_file': {
        const r = await pteroFetch(env, 'PUT', `/servers/${srv}/files/rename`, {
          root: '/',
          files: [{ from: args.from, to: args.to }]
        })
        if (r.status === 204) return ok(`✏️ File berhasil di-rename:\n${args.from} → ${args.to}`)
        return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
      }

      case 'ptero_create_folder': {
        const r = await pteroFetch(env, 'POST', `/servers/${srv}/files/create-folder`, {
          root: '/',
          name: args.path.replace(/^\//, '')
        })
        if (r.status === 204) return ok(`📁 Folder '${args.path}' berhasil dibuat.`)
        return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
      }

      case 'ptero_list_backups': {
        const r = await pteroFetch(env, 'GET', `/servers/${srv}/backups`)
        if (!r.ok) return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
        const backups = r.data.data || []
        if (backups.length === 0) return ok('💾 Belum ada backup.')
        const list = backups.map(b => {
          const a = b.attributes
          const size = ((a.bytes || 0) / 1024 / 1024).toFixed(2)
          const locked = a.is_locked ? '🔒' : '🔓'
          return `${locked} ${a.name} — ${size} MB — ${a.created_at}`
        }).join('\n')
        return ok(`💾 Daftar Backup:\n${list}`)
      }

      case 'ptero_create_backup': {
        const body = {}
        if (args.name) body.name = args.name
        if (args.locked !== undefined) body.is_locked = args.locked
        const r = await pteroFetch(env, 'POST', `/servers/${srv}/backups`, body)
        if (!r.ok) return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
        const a = r.data.attributes
        return ok(`✅ Backup dibuat:\n• Nama: ${a.name}\n• UUID: ${a.uuid}\n• Status: ${a.is_successful ? 'Selesai' : 'Pending...'}`)
      }

      case 'ptero_server_activity': {
        const r = await pteroFetch(env, 'GET', `/servers/${srv}/activity`)
        if (!r.ok) return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
        const logs = r.data.data || []
        if (logs.length === 0) return ok('📋 Belum ada activity log.')
        const list = logs.slice(0, 10).map(l => {
          const a = l.attributes
          return `• [${a.timestamp}] ${a.event} — ${a.actor?.username || 'system'}`
        }).join('\n')
        return ok(`📋 Activity Log (10 terbaru):\n${list}`)
      }

      case 'ptero_list_all_servers': {
        const r = await pteroFetch(env, 'GET', '/servers')
        if (!r.ok) return err(`API error ${r.status}: ${JSON.stringify(r.data)}`)
        const servers = r.data.data || []
        if (servers.length === 0) return ok('Tidak ada server ditemukan.')
        const list = servers.map(s => {
          const a = s.attributes
          return `• ${a.name} [${a.identifier}] — Node: ${a.node} — Status: ${a.status || 'unknown'}`
        }).join('\n')
        return ok(`🖥️ Semua Server (${servers.length}):\n${list}`)
      }

      default:
        return null
    }
  } catch (e) {
    return err(`Request gagal: ${e.message}`)
  }
}

function ok(text) {
  return { isError: false, content: [{ type: 'text', text }] }
}
function err(text) {
  return { isError: true, content: [{ type: 'text', text: `❌ Error: ${text}` }] }
}
