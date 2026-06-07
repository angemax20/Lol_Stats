const supabase = require('../config/supabase');

function pickRandom(array, amount) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, amount);
}

async function main() {
  console.log('Cargando items, runas, hechizos y partidas...');

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('item_id');

  const { data: runes, error: runesError } = await supabase
    .from('runes')
    .select('rune_id');

  const { data: spells, error: spellsError } = await supabase
    .from('spells')
    .select('spell_id');

  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, item_ids, rune_ids, spell_ids');

  if (itemsError || runesError || spellsError || matchesError) {
    console.error('Error cargando datos:', {
      itemsError,
      runesError,
      spellsError,
      matchesError
    });
    return;
  }

  if (!items.length || !runes.length || !spells.length) {
    console.error('Necesitas datos en items, runes y spells antes de randomizar.');
    return;
  }

  console.log(`Items: ${items.length}`);
  console.log(`Runas: ${runes.length}`);
  console.log(`Hechizos: ${spells.length}`);
  console.log(`Partidas/jugadores: ${matches.length}`);

  for (const match of matches) {
    const hasItems = Array.isArray(match.item_ids) && match.item_ids.length > 0;
    const hasRunes = Array.isArray(match.rune_ids) && match.rune_ids.length > 0;
    const hasSpells = Array.isArray(match.spell_ids) && match.spell_ids.length > 0;

    if (hasItems && hasRunes && hasSpells) {
      continue;
    }

    const itemIds = pickRandom(items, 6).map(item => item.item_id);
    const runeIds = pickRandom(runes, 6).map(rune => rune.rune_id);
    const spellIds = pickRandom(spells, 2).map(spell => spell.spell_id);

    const { error } = await supabase
      .from('matches')
      .update({
        item_ids: itemIds,
        rune_ids: runeIds,
        spell_ids: spellIds
      })
      .eq('id', match.id);

    if (error) {
      console.error(`Error actualizando match row ${match.id}:`, error.message);
    } else {
      console.log(`Match row ${match.id} actualizado.`);
    }
  }

  console.log('Builds randomizadas correctamente.');
}

main();