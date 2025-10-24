import { applyCors } from './_cors.js';

async function parseMultipart(req) {
  const ct = req.headers['content-type'] || '';
  const m = ct.match(/boundary=([^;]+)/i);
  if (!m) throw new Error('No boundary in content-type');
  const boundary = '--' + m[1];

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  const parts = buffer.toString('binary').split(boundary);
  for (const part of parts) {
    if (part.includes('Content-Disposition') && part.includes('filename=')) {
      const [headers, ...bodyParts] = part.split('\r\n\r\n');
      const bodyBinary = bodyParts.join('\r\n\r\n').replace(/\r\n--\s*$/, '');
      const nameMatch = headers.match(/name="([^"]+)"/i);
      const filenameMatch = headers.match(/filename="([^"]*)"/i);
      const typeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);

      const fieldName = nameMatch?.[1] || 'file';
      const filename = filenameMatch?.[1] || 'upload.bin';
      const mime = typeMatch?.[1] || 'application/octet-stream';
      const fileBuffer = Buffer.from(bodyBinary, 'binary');

      return { fieldName, filename, mime, buffer: fileBuffer };
    }
  }
  throw new Error('No file part found');
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, hint: 'POST multipart/form-data with field "file"' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const { filename, mime, buffer } = await parseMultipart(req);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mime};base64,${base64}`;
    return res.status(200).json({ ok: true, filename, mime, size: buffer.length, data_url: dataUrl });
  } catch (e) {
    return res.status(400).json({ ok: false, error: e.message || String(e) });
  }
}
