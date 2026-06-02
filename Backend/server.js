require('dotenv').config();

const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const riotRoutes = require('./routes/riot');

const app = express();

app.use(cors({
  origin: 'https://lol-stats-x3ln.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

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

app.get('/', (req, res) => {
  res.send('Backend funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});

