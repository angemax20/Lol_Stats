const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

router.get('/', async (req, res) => {
  try {
    const { tier = 'Retador', region = 'all' } = req.query;

    let query = supabase
      .from('summoners')
      .select(`
        id,
        name,
        tag_line,
        region,
        profile_icon_id,
        level,
        soloq_tier,
        soloq_rank,
        soloq_lp,
        soloq_wins,
        soloq_losses
      `)
      .eq('soloq_tier', tier)
      .order('soloq_lp', { ascending: false })
      .limit(100);

    if (region !== 'all') {
      query = query.eq('region', region);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo leaderboard' });
  }
});

module.exports = router;