const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// .env'den al veya varsayılan değer kullan
const SECRET_KEY = process.env.JWT_SECRET || 'lazoot-secret-key';

// KAYIT
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' });
    }

    const newUser = new User({
      name,
      email,
      password,
      role: role || 'user' // admin panelden el ile atanabilir
    });

    await newUser.save();

    res.status(201).json({ message: 'Kayıt başarılı!' });
  } catch (err) {
    console.error('❌ Kayıt hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// GİRİŞ
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'E-posta veya parola hatalı' });
    }

    // JWT oluştur
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Giriş başarılı',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role //  Admin kontrolü için gerekli
      },
      token
    });
  } catch (err) {
    console.error('❌ Giriş hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

module.exports = router;
