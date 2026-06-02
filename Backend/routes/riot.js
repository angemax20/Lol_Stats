const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE;

// Buscar invocador por nombre
router.get('/summoner/:name', async (req, res) => {
  const { name } = req.params;

  try {
    console.log(' Buscando summoner:', name);

    const searchTerm = `%${name}%`;
    const encodedSearch = encodeURIComponent(searchTerm);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/summoners?name=ilike.${encodedSearch}&select=id,name,region,profile_icon_id,level,last_seen,soloq_tier,soloq_rank,soloq_lp,soloq_wins,soloq_losses,flex_tier,flex_rank,flex_lp,flex_wins,flex_losses&order=last_seen.desc&limit=10`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const summoners = await response.json();

    if (!response.ok) {
      console.error(' Error Supabase:', summoners);
      return res.status(500).json({ error: 'Error al buscar invocador' });
    }

    if (!summoners || summoners.length === 0) {
      console.log(' No se encontraron summoners con nombre:', name);
      return res.status(404).json({ error: 'Invocador no encontrado' });
    }

    console.log(' Summoners encontrados:', summoners.length);

    // Para cada summoner, obtener sus últimas 10 partidas
    const summonersWithMatches = await Promise.all(
      summoners.map(async (summoner) => {
        const matchResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/matches?summoner_id=eq.${summoner.id}&select=*&order=created_at.desc&limit=10`,
          {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          }
        );

        const matches = await matchResponse.json();

        return {
          ...summoner,
          recentMatches: matches || []
        };
      })
    );

    res.json(summonersWithMatches);

  } catch (error) {
    console.error(' Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los summoners
router.get('/summoners', async (req, res) => {
  try {
    const { region, limit = 20, offset = 0 } = req.query;

    let url = `${SUPABASE_URL}/rest/v1/summoners?select=id,name,region,profile_icon_id,level,last_seen,soloq_tier,soloq_rank,soloq_lp,soloq_wins,soloq_losses,flex_tier,flex_rank,flex_lp,flex_wins,flex_losses&order=last_seen.desc&limit=${limit}&offset=${offset}`;

    if (region) {
      url += `&region=eq.${region}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Error al obtener summoners' });
    }

    res.json(data);

  } catch (error) {
    console.error(' Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los invocadores de una partida por match_id
router.get('/match/:matchId', async (req, res) => {
  const { matchId } = req.params;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/matches?match_id=eq.${matchId}&select=*,summoners(id,name,region,profile_icon_id,level,last_seen,soloq_tier,soloq_rank,soloq_lp,soloq_wins,soloq_losses,flex_tier,flex_rank,flex_lp,flex_wins,flex_losses)`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const players = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Error al obtener jugadores de la partida' });
    }

    res.json(players);

  } catch (error) {
    console.error(' Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint básico para Tier List
router.get('/tierlist', async (req, res) => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/tier_list?select=id,tier_position,strength_score,champions:champion_id(name)&order=tier_position.asc`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const tierList = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Error al obtener Tier List' });
    }

    res.json(tierList);

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
