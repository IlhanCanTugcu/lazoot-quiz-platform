const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT || 5000;

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB bağlantısı başarılı'))
  .catch((err) => console.error('❌ MongoDB bağlantı hatası:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Rotalar
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
app.use('/api', authRoutes);
app.use('/api', quizRoutes);

// Oda bazlı skorları tutan geçici yapı
const roomScores = {};

io.on('connection', (socket) => {
  console.log('📡 Kullanıcı bağlandı: ' + socket.id);

  // Odaya katılma
  socket.on('join_room', ({ roomId, username }) => {
    socket.join(roomId);
    console.log(`👥 ${username} (${socket.id}) ${roomId} odasına katıldı`);

    if (!roomScores[roomId]) {
      roomScores[roomId] = {};
    }

    roomScores[roomId][socket.id] = {
      name: username,
      score: 0
    };

    socket.emit('joined_room', roomId);
  });

  // Quiz başlatma
  socket.on('start_quiz', ({ roomId, questions }) => {
    console.log(`🚀 ${roomId} odasında quiz başlıyor...`);

    io.to(roomId).emit('quiz_starting');

    setTimeout(() => {
      let index = 0;

      // İlk soruyu hemen gönder
      io.to(roomId).emit('new_question', {
        question: questions[index],
        index: index + 1
      });
      index++;

      const interval = setInterval(() => {
        if (index < questions.length) {
          io.to(roomId).emit('new_question', {
            question: questions[index],
            index: index + 1
          });
          index++;
        } else {
          io.to(roomId).emit('quiz_end');
          clearInterval(interval);
        }
      }, 15000); // Her 15 saniyede bir yeni soru
    }, 3000); // 3 saniyelik "quiz_starting" ekranı süresi
  });

  // Cevap kontrolü ve skor güncelleme
  socket.on('submit_answer', ({ roomId, answerIndex, correctIndex }) => {
    const user = roomScores[roomId]?.[socket.id];
    if (!user) return;

    if (answerIndex === correctIndex) {
      user.score += 1;
    }

    const scoreList = Object.values(roomScores[roomId]);
    io.to(roomId).emit('score_update', scoreList);
  });

  // ❌ Bağlantı koparsa kullanıcıyı sil
  socket.on('disconnect', () => {
    console.log('📴 Kullanıcı ayrıldı: ' + socket.id);
    for (let roomId in roomScores) {
      delete roomScores[roomId][socket.id];
    }
  });
});

// ✅ Test endpoint
app.get('/', (req, res) => {
  res.send('🌐 Lazoot API çalışıyor');
});

// ✅ Sunucu başlat
server.listen(PORT, () => {
  console.log(`🚀 HTTP + Socket Sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});
