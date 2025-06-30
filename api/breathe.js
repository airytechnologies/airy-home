export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const metadata = {
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
    referrer: req.headers['referer'] || null,
  };

  console.log('Block creation request:', metadata);

  res.status(200).json({ message: 'block_00000005 created', metadata });
}
