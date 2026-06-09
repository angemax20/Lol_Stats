const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('summoners')
      .select(`
        id,
        name,
        region,
        profile_icon_id,
        level,
        soloq_tier,
        soloq_rank,
        soloq_lp,
        soloq_wins,
        soloq_losses
      `)
      .eq('soloq_tier', 'Retador')
      .order('soloq_lp', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo leaderboard' });
  }
});

module.exports = router;