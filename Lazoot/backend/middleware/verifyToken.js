const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'lazoot-secret-key';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: 'Token gerekli' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // isteğe kullanıcı bilgisi eklendi
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Geçersiz token' });
  }
};

module.exports = verifyToken;
