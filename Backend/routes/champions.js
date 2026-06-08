const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

function normalizeIds(ids) {
  return [...new Set((ids || []).filter(Boolean).map(Number))].sort((a, b) => a - b);
}

function orderedUniqueIds(ids) {
  return [...new Set((ids || []).filter(Boolean).map(Number))];
}

function buildKey(match) {
  return JSON.stringify({
    items: normalizeIds(match.item_ids),
    primaryRune: match.primary_rune_id || null,
    primaryRunes: normalizeIds(match.rune_ids),
    secondaryRunes: normalizeIds(match.secondary_rune_ids),
    spells: normalizeIds(match.spell_ids)
  });
}

async function fetchAllWinningMatchesForChampion(championId) {
  const pageSize = 1000;
  let from = 0;
  let rows = [];

  while (true) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        champion_id,
        lane,
        role,
        win,
        item_ids,
        primary_rune_id,
        rune_ids,
        secondary_rune_ids,
        spell_ids,
        champions (
          champion_id,
          champion_name,
          champion_title,
          image
        )
      `)
      .eq('champion_id', championId)
      .eq('win', true)
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    rows = rows.concat(data || []);

    if (!data || data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

async function fetchRowsByIds(table, column, ids) {
  const uniqueIds = orderedUniqueIds(ids);

  if (!uniqueIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .in(column, uniqueIds);

  if (error) {
    throw error;
  }

  return data || [];
}

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
    const matches = await fetchAllWinningMatchesForChampion(championId);

    if (!matches.length) {
      return res.status(404).json({ error: 'No hay victorias registradas para este campeon' });
    }

    const buildCounts = new Map();

    matches.forEach(match => {
      const key = buildKey(match);
      const current = buildCounts.get(key);

      if (current) {
        current.wins += 1;
      } else {
        buildCounts.set(key, {
          wins: 1,
          match
        });
      }
    });

    const bestBuild = [...buildCounts.values()]
      .sort((a, b) => b.wins - a.wins)[0];

    const bestMatch = bestBuild.match;
    const itemIds = orderedUniqueIds(bestMatch.item_ids);
    const primaryRuneIds = orderedUniqueIds(bestMatch.rune_ids);
    const secondaryRuneIds = orderedUniqueIds(bestMatch.secondary_rune_ids);
    const spellIds = orderedUniqueIds(bestMatch.spell_ids);
    const allRuneIds = orderedUniqueIds([
      bestMatch.primary_rune_id,
      ...primaryRuneIds,
      ...secondaryRuneIds
    ]);

    const [items, runes, spells] = await Promise.all([
      fetchRowsByIds('items', 'item_id', itemIds),
      fetchRowsByIds('runes', 'rune_id', allRuneIds),
      fetchRowsByIds('spells', 'spell_id', spellIds)
    ]);

    const itemMap = Object.fromEntries(items.map(item => [Number(item.item_id), item]));
    const runeMap = Object.fromEntries(runes.map(rune => [Number(rune.rune_id), rune]));
    const spellMap = Object.fromEntries(spells.map(spell => [Number(spell.spell_id), spell]));

    res.json({
      build_id: `matches-${championId}`,
      champion_id: Number(championId),
      role: bestMatch.lane || bestMatch.role || 'Rol no definido',
      title: 'Build con mas victorias',
      wins: bestBuild.wins,
      total_wins: matches.length,
      champions: bestMatch.champions,
      build_items: itemIds
        .map((id, index) => ({
          item_order: index,
          items: itemMap[id]
        }))
        .filter(row => row.items),
      build_runes: [
        bestMatch.primary_rune_id
          ? {
              rune_order: 0,
              rune_type: 'principal',
              runes: runeMap[Number(bestMatch.primary_rune_id)]
            }
          : null,
        ...primaryRuneIds.map((id, index) => ({
          rune_order: index + 1,
          rune_type: 'principal',
          runes: runeMap[id]
        })),
        ...secondaryRuneIds.map((id, index) => ({
          rune_order: index + 4,
          rune_type: 'secundaria',
          runes: runeMap[id]
        }))
      ].filter(row => row && row.runes),
      build_spells: spellIds
        .map((id, index) => ({
          spell_order: index,
          spells: spellMap[id]
        }))
        .filter(row => row.spells)
    });
  } catch (error) {
    console.error('Error obteniendo build del campeon:', error.message);
    res.status(500).json({ error: 'Error obteniendo build del campeon' });
  }
});

module.exports = router;
