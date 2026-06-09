const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo torneos' });
  }
});

router.post('/', async (req, res) => {
  const {
    user_id,
    name,
    participant_count,
    teams,
    bracket
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        user_id,
        name,
        participant_count,
        teams,
        bracket
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error guardando torneo' });
  }
});

module.exports = router;