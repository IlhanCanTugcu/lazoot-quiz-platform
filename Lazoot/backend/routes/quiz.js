const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const verifyToken = require('../middleware/verifyToken');

// Tüm quizleri getir
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (err) {
    console.error('Quiz listeleme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.get('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    res.json(quiz);
  } catch (err) {
    console.error('Quiz detay hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Sadece giriş yapmış kullanıcılar quizleri görebilsin
router.get('/quizzes', verifyToken, async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni quiz oluştur
router.post('/quizzes', verifyToken, async (req, res) => {
  try {
    const newQuiz = new Quiz(req.body);
    await newQuiz.save();
    res.status(201).json({ message: 'Quiz başarıyla eklendi.' });
  } catch (err) {
    console.error('Quiz ekleme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
