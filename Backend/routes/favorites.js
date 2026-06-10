const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from('user_favorite_summoners')
      .select(`
        created_at,
        summoners (
          id,
          name,
          tag_line,
          region,
          profile_icon_id,
          level,
          last_seen,
          soloq_tier,
          soloq_rank,
          soloq_lp,
          soloq_wins,
          soloq_losses,
          flex_tier,
          flex_rank,
          flex_lp,
          flex_wins,
          flex_losses
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo favoritos' });
  }
});

router.post('/', async (req, res) => {
  const { user_id, summoner_id } = req.body;

  try {
    const { data, error } = await supabase
      .from('user_favorite_summoners')
      .insert({
        user_id,
        summoner_id
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error guardando favorito' });
  }
});

router.delete('/', async (req, res) => {
  const { user_id, summoner_id } = req.body;

  try {
    const { error } = await supabase
      .from('user_favorite_summoners')
      .delete()
      .eq('user_id', user_id)
      .eq('summoner_id', summoner_id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Favorito eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando favorito' });
  }
});

module.exports = router;