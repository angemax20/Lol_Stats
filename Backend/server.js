require('dotenv').config();

const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const riotRoutes = require('./routes/riot');
const tierlistRoutes = require('./routes/tierlist');
const championsRoutes = require('./routes/champions');

const app = express();

const corsOptions = {
  origin: 'https://lol-stats-x3ln.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://lol-stats-x3ln.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/riot', riotRoutes);
app.use('/api/tierlist', tierlistRoutes);
app.use('/api/champions', championsRoutes);

app.get('/', (req, res) => {
  res.send('Backend funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});

