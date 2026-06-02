const express = require('express');
const router = express.Router();

const supabase =
require('../config/supabase');

// OBTENER TIER LIST
router.get('/', async (req, res) => {

  try {

    const { data, error } =
    await supabase
      .from('tierlists')
      .select(`
        *,
        champions (
          champion_name,
          champion_title,
          role
        )
      `)
      .order('tier', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error obteniendo tier list'
    });

  }

});

module.exports = router;