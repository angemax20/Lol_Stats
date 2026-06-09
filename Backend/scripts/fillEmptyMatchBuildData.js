require('dotenv').config();

const supabase = require('../config/supabase');

function pickRandom(array, amount) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled.slice(0, amount);
}

function pickOne(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function isEmptyArray(value) {
  return !Array.isArray(value) || value.length === 0;
}

function hasMissingBuildData(match) {
  return isEmptyArray(match.item_ids)
    || isEmptyArray(match.spell_ids)
    || !match.primary_rune_id
    || isEmptyArray(match.rune_ids)
    || isEmptyArray(match.secondary_rune_ids);
}

const supportItemNames = [
  'world atlas',
  'runic compass',
  'bounty of worlds',
  'celestial opposition',
  'dream maker',
  'bloodsong',
  'solstice sleigh',
  "zaz'zak's realmspike"
];

const starterItemNames = [
  "doran's blade",
  "doran's ring",
  "doran's shield",
  'cull',
  'dark seal',
  'tear of the goddess',
  'corrupting potion',
  'refillable potion',
  'health potion',
  'control ward',
  'oracle lens',
  'stealth ward',
  'farsight alteration',
  'scorchclaw pup',
  'gustwalker hatchling',
  'mosstomper seedling'
];

function isSummonersRiftItem(item) {
  return item.maps?.['11'] === true;
}

function isPurchasable(item) {
  return item.gold?.purchasable === true;
}

function isSupportItem(item) {
  const name = item.item_name.toLowerCase();
  return supportItemNames.some(supportName => name.includes(supportName));
}

function isStarterItem(item) {
  const name = item.item_name.toLowerCase();
  return starterItemNames.some(starterName => name.includes(starterName));
}

async function getLatestVersion() {
  const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  const versions = await versionsRes.json();

  return versions[0];
}

async function getValidItems(latestVersion) {
  const itemsRes = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`
  );

  const itemsData = await itemsRes.json();

  const allItems = Object.entries(itemsData.data).map(([id, item]) => ({
    item_id: Number(id),
    item_name: item.name,
    tags: item.tags || [],
    maps: item.maps || {},
    into: item.into || [],
    gold: item.gold || {},
    requiredChampion: item.requiredChampion || null,
    requiredAlly: item.requiredAlly || null
  }));

  const boots = allItems.filter(item => {
    return isSummonersRiftItem(item)
      && isPurchasable(item)
      && item.tags.includes('Boots')
      && !item.into?.length
      && item.item_name.toLowerCase() !== 'boots'
      && item.gold.total >= 900;
  });

  const completedItems = allItems.filter(item => {
    if (!isSummonersRiftItem(item)) return false;
    if (!isPurchasable(item)) return false;
    if (item.tags.includes('Boots')) return false;
    if (item.tags.includes('Consumable')) return false;
    if (item.tags.includes('Trinket')) return false;
    if (item.into && item.into.length > 0) return false;
    if (isSupportItem(item)) return false;
    if (isStarterItem(item)) return false;
    if (item.requiredChampion || item.requiredAlly) return false;
    if (item.gold.total < 2200) return false;

    return true;
  });

  return {
    boots,
    completedItems
  };
}

async function getValidSpellIds(latestVersion) {
  const spellsRes = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/summoner.json`
  );

  const spellsData = await spellsRes.json();

  return new Set(
    Object.values(spellsData.data)
      .filter(spell => {
        const name = spell.name.toLowerCase();
        const modes = spell.modes || [];

        return name !== 'flee' && modes.includes('CLASSIC');
      })
      .map(spell => Number(spell.key))
  );
}

function buildRandomItemIds(boots, completedItems) {
  const boot = pickOne(boots);
  const fiveItems = pickRandom(completedItems, 5);

  return [
    boot.item_id,
    ...fiveItems.map(item => item.item_id)
  ];
}

function buildRandomRunes(runes) {
  const keystones = runes.filter(rune => rune.is_keystone && rune.rune_slot === 0);
  const normalRunes = runes.filter(rune => !rune.is_keystone && rune.rune_slot > 0);
  const runeTrees = [...new Set(runes.map(rune => rune.rune_tree))];

  const keystone = pickOne(keystones);
  const primaryTree = keystone.rune_tree;

  const primaryRunes = [1, 2, 3].map(slot => {
    const options = normalRunes.filter(rune => {
      return rune.rune_tree === primaryTree && rune.rune_slot === slot;
    });

    return pickOne(options);
  });

  const validSecondaryTrees = runeTrees.filter(tree => {
    if (tree === primaryTree) return false;

    const slotsAvailable = [1, 2, 3].filter(slot => {
      return normalRunes.some(rune => rune.rune_tree === tree && rune.rune_slot === slot);
    });

    return slotsAvailable.length >= 2;
  });

  const secondaryTree = pickOne(validSecondaryTrees);
  const secondarySlots = pickRandom([1, 2, 3], 2);
  const secondaryRunes = secondarySlots.map(slot => {
    const options = normalRunes.filter(rune => {
      return rune.rune_tree === secondaryTree && rune.rune_slot === slot;
    });

    return pickOne(options);
  });

  return {
    primary_rune_id: keystone.rune_id,
    rune_ids: primaryRunes.map(rune => rune.rune_id),
    secondary_rune_ids: secondaryRunes.map(rune => rune.rune_id)
  };
}

async function main() {
  console.log('Cargando datos validos para rellenar partidas vacias...');

  const latestVersion = await getLatestVersion();
  const { boots, completedItems } = await getValidItems(latestVersion);
  const validSpellIds = await getValidSpellIds(latestVersion);

  const { data: spells, error: spellsError } = await supabase
    .from('spells')
    .select('spell_id, spell_name');

  const { data: runes, error: runesError } = await supabase
    .from('runes')
    .select('rune_id, rune_name, rune_tree, is_keystone, rune_slot');

  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, item_ids, spell_ids, primary_rune_id, rune_ids, secondary_rune_ids');

  if (spellsError || runesError || matchesError) {
    console.error({ spellsError, runesError, matchesError });
    return;
  }

  const validSpells = spells.filter(spell => validSpellIds.has(Number(spell.spell_id)));
  const emptyMatches = matches.filter(hasMissingBuildData);

  if (boots.length === 0 || completedItems.length < 5 || validSpells.length < 2) {
    console.error('Faltan botas, items completos o hechizos validos.');
    return;
  }

  if (!runes.some(rune => rune.is_keystone) || runes.length < 10) {
    console.error('Faltan runas validas.');
    return;
  }

  console.log(`Data Dragon version: ${latestVersion}`);
  console.log(`Partidas revisadas: ${matches.length}`);
  console.log(`Partidas con datos faltantes: ${emptyMatches.length}`);

  if (emptyMatches.length === 0) {
    console.log('No hay partidas vacias para rellenar.');
    return;
  }

  for (const match of emptyMatches) {
    const updateData = {};

    if (isEmptyArray(match.item_ids)) {
      updateData.item_ids = buildRandomItemIds(boots, completedItems);
    }

    if (isEmptyArray(match.spell_ids)) {
      updateData.spell_ids = pickRandom(validSpells, 2).map(spell => spell.spell_id);
    }

    const needsRunes = !match.primary_rune_id
      || isEmptyArray(match.rune_ids)
      || isEmptyArray(match.secondary_rune_ids);

    if (needsRunes) {
      const runeBuild = buildRandomRunes(runes);

      if (!match.primary_rune_id) {
        updateData.primary_rune_id = runeBuild.primary_rune_id;
      }

      if (isEmptyArray(match.rune_ids)) {
        updateData.rune_ids = runeBuild.rune_ids;
      }

      if (isEmptyArray(match.secondary_rune_ids)) {
        updateData.secondary_rune_ids = runeBuild.secondary_rune_ids;
      }
    }

    const { error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', match.id);

    if (error) {
      console.error(`Error actualizando match ${match.id}:`, error.message);
    } else {
      console.log(`Match ${match.id} rellenado.`);
    }
  }

  console.log('Partidas vacias rellenadas correctamente.');
}

main();
