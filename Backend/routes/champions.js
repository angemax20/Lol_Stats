const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('champions')
      .select('champion_id, champion_name, champion_title, image')
      .order('champion_name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo campeones' });
  }
});

router.get('/:championId/build', async (req, res) => {
  const { championId } = req.params;

  try {
    const { data: build, error } = await supabase
      .from('champion_builds')
      .select(`
        build_id,
        champion_id,
        role,
        title,
        champions (
          champion_id,
          champion_name,
          champion_title,
          image
        ),
        build_items (
          item_order,
          items (
            item_id,
            item_name,
            image
          )
        ),
        build_runes (
          rune_order,
          rune_type,
          runes (
            rune_id,
            rune_name,
            image,
            rune_tree
          )
        ),
        build_spells (
          spell_order,
          spells (
            spell_id,
            spell_name,
            image
          )
        )
      `)
      .eq('champion_id', championId)
      .order('item_order', {
        foreignTable: 'build_items',
        ascending: true
      })
      .order('rune_order', {
        foreignTable: 'build_runes',
        ascending: true
      })
      .order('spell_order', {
        foreignTable: 'build_spells',
        ascending: true
      })
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!build) {
      return res.status(404).json({ error: 'Build no encontrada para este campeón' });
    }

    res.json(build);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo build del campeón' });
  }
});

module.exports = router;s