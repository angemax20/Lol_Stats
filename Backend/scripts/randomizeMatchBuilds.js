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
    from: item.from || [],
    gold: item.gold || {},
    depth: item.depth || 0,
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

async function main() {
  console.log('Cargando items y hechizos validos desde Data Dragon...');

  const latestVersion = await getLatestVersion();
  const { boots, completedItems } = await getValidItems(latestVersion);
  const validSpellIds = await getValidSpellIds(latestVersion);

  const { data: spells, error: spellsError } = await supabase
    .from('spells')
    .select('spell_id, spell_name');

  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id');

  if (spellsError || matchesError) {
    console.error({ spellsError, matchesError });
    return;
  }

  const validSpells = spells.filter(spell => validSpellIds.has(Number(spell.spell_id)));

  if (boots.length === 0 || completedItems.length < 5 || validSpells.length < 2) {
    console.error('Faltan boots, items completos o hechizos.');
    return;
  }

  console.log(`Data Dragon version: ${latestVersion}`);
  console.log(`Botas validas: ${boots.length}`);
  console.log(`Items completos validos: ${completedItems.length}`);
  console.log(`Hechizos validos: ${validSpells.length}`);
  console.log(`Filas de matches: ${matches.length}`);

  for (const match of matches) {
    const boot = pickRandom(boots, 1)[0];
    const fiveItems = pickRandom(completedItems, 5);
    const spellIds = pickRandom(validSpells, 2).map(spell => spell.spell_id);

    const itemIds = [
      boot.item_id,
      ...fiveItems.map(item => item.item_id)
    ];

    const { error } = await supabase
      .from('matches')
      .update({
        item_ids: itemIds,
        spell_ids: spellIds
      })
      .eq('id', match.id);

    if (error) {
      console.error(`Error actualizando match ${match.id}:`, error.message);
    } else {
      console.log(`Match ${match.id} actualizado.`);
    }
  }

  console.log('Items y hechizos randomizados correctamente.');
}

main();
  