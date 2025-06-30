export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const metadata = {
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    referrer: req.headers.referer || null
  };

  const blockId = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  const message = `block_${blockId} created`;

  return res.status(200).json({ message, metadata });
}
