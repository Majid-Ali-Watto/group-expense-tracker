// Characters chosen to avoid visual ambiguity (no 0/O, 1/I/l)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Generate `count` random recovery passcodes in the format XXXX-XXXX-XXXX.
 */
export function generatePasscodes(count = 5) {
  const codes = []
  for (let i = 0; i < count; i++) {
    let raw = ''
    for (let j = 0; j < 12; j++) {
      raw += CHARS[Math.floor(Math.random() * CHARS.length)]
    }
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`)
  }
  return codes
}

/**
 * Open a print-friendly window with the recovery codes so the user can
 * save them as PDF via the browser's print dialog.
 */
export function printPasscodes(userName, mobile, codes) {
  const rows = codes
    .map(
      (c, i) => `
    <tr>
      <td class="num">${i + 1}.</td>
      <td class="code">${c}</td>
      <td class="used"></td>
    </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recovery Passcodes — ${userName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', Courier, monospace; max-width: 500px; margin: 40px auto; padding: 0 24px; color: #222; }
    h2 { font-size: 20px; margin-bottom: 6px; }
    .meta { font-size: 13px; color: #555; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; padding: 6px 8px; border-bottom: 2px solid #ddd; text-align: left; }
    th.used-h, td.used { width: 60px; }
    td { padding: 10px 8px; border-bottom: 1px solid #eee; vertical-align: middle; }
    td.num { width: 28px; color: #aaa; font-size: 13px; }
    td.code { font-size: 17px; font-weight: bold; letter-spacing: 3px; }
    td.used { border: 1px dashed #ccc; margin: 4px; }
    .warning { background: #fff8e1; border-left: 4px solid #f0a500; padding: 12px 16px; font-size: 13px; line-height: 1.6; }
    .warning strong { display: block; margin-bottom: 4px; }
    @media print { body { margin: 20px auto; } }
  </style>
</head>
<body>
  <h2>Recovery Passcodes</h2>
  <div class="meta">
    Name: <strong>${userName}</strong>&nbsp;&nbsp;|&nbsp;&nbsp;Mobile: ${mobile}
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Passcode</th>
        <th class="used-h">Used ✓</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="warning">
    <strong>⚠️ Keep this page private and secure.</strong>
    Each code can be used <em>only once</em> to reset your login code.
    Cross off each code after use.
  </div>
</body>
</html>`

  const w = window.open('', '_blank', 'width=560,height=680')
  if (w) {
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }
}
