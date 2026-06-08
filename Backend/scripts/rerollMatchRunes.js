require('dotenv').config();

const supabase = require('../config/supabase');

function pickOne(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function main() {
  const { data: runes, error: runesError } = await supabase
    .from('runes')
    .select('rune_id, rune_name, rune_tree, is_keystone, rune_slot');

  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id');

  if (runesError || matchesError) {
    console.error({ runesError, matchesError });
    return;
  }

  const keystones = runes.filter(r => r.is_keystone && r.rune_slot === 0);
  const normalRunes = runes.filter(r => !r.is_keystone && r.rune_slot > 0);
  const runeTrees = [...new Set(runes.map(r => r.rune_tree))];

  for (const match of matches) {
    const keystone = pickOne(keystones);
    const primaryTree = keystone.rune_tree;

    const primarySlot1 = normalRunes.filter(r => r.rune_tree === primaryTree && r.rune_slot === 1);
    const primarySlot2 = normalRunes.filter(r => r.rune_tree === primaryTree && r.rune_slot === 2);
    const primarySlot3 = normalRunes.filter(r => r.rune_tree === primaryTree && r.rune_slot === 3);

    if (!primarySlot1.length || !primarySlot2.length || !primarySlot3.length) {
      console.log(`Rama primaria incompleta: ${primaryTree}`);
      continue;
    }

    const validSecondaryTrees = runeTrees.filter(tree => {
      if (tree === primaryTree) return false;

      const slotsAvailable = [1, 2, 3].filter(slot => {
        return normalRunes.some(r => r.rune_tree === tree && r.rune_slot === slot);
      });

      return slotsAvailable.length >= 2;
    });

    const secondaryTree = pickOne(validSecondaryTrees);

    const secondarySlots = [1, 2, 3].sort(() => Math.random() - 0.5).slice(0, 2);

    const secondaryRunes = secondarySlots.map(slot => {
      const options = normalRunes.filter(r => {
        return r.rune_tree === secondaryTree && r.rune_slot === slot;
      });

      return pickOne(options);
    });

    const primaryRunes = [
      pickOne(primarySlot1),
      pickOne(primarySlot2),
      pickOne(primarySlot3)
    ];

    const { error } = await supabase
      .from('matches')
      .update({
        primary_rune_id: keystone.rune_id,
        rune_ids: primaryRunes.map(r => r.rune_id),
        secondary_rune_ids: secondaryRunes.map(r => r.rune_id)
      })
      .eq('id', match.id);

    if (error) {
      console.error(`Error en match ${match.id}:`, error.message);
    } else {
      console.log(`Match ${match.id}: ${keystone.rune_name} + ${primaryTree}, secundaria ${secondaryTree}`);
    }
  }

  console.log('Runas reasignadas correctamente.');
}

main();