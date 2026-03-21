export default function handler(req, res) {
  res.json({
    status: 'ok',
    message: 'DentaCloud API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}