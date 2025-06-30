export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const referrer = req.headers['referer'] || 'unknown';
  const timestamp = new Date().toISOString();

  // Simulate block number for now (replace with real tracking later)
  const blockNumber = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
  const blockId = `block_${blockNumber}`;

  console.log("🫧 New breath received:");
  console.log({ blockId, timestamp, ip, userAgent, referrer });

  return res.status(200).json({ blockId, timestamp });
}