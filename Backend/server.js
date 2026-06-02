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
app.options('*', cors());
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

