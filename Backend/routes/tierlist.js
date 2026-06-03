const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

router.get('/', async (req, res) => {

  try {

    const { data, error } = await supabase
      .from('tierlist')
      .select(`
        *,
        champions (
          champion_id,
          name,
          image
        )
      `)
      .order('tier', { ascending: true });

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message
      });
    }

    res.json(data);

  } catch(err) {

    console.log(err);

    res.status(500).json({
      error: 'Error obteniendo tier list'
    });

  }

});

module.exports = router;