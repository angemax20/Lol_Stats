require('dotenv').config();

const supabase = require('../config/supabase');

async function main() {
  const versionsResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  const versions = await versionsResponse.json();
  const latestVersion = versions[0];

  console.log(`Usando Data Dragon version: ${latestVersion}`);

  const [itemsResponse, spellsResponse, runesResponse] = await Promise.all([
    fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`),
    fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/summoner.json`),
    fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/runesReforged.json`)
  ]);

  const itemsData = await itemsResponse.json();
  const spellsData = await spellsResponse.json();
  const runesData = await runesResponse.json();

  const items = Object.entries(itemsData.data).map(([itemId, item]) => ({
    item_id: Number(itemId),
    item_name: item.name,
    image: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${item.image.full}`
  }));

  const spells = Object.values(spellsData.data).map(spell => ({
    spell_id: Number(spell.key),
    spell_name: spell.name,
    image: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${spell.image.full}`
  }));

  const runes = [];

  for (const tree of runesData) {
    tree.slots.forEach((slot, slotIndex) => {
      slot.runes.forEach(rune => {
        runes.push({
          rune_id: rune.id,
          rune_name: rune.name,
          image: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`,
          rune_tree: tree.name,
          is_keystone: slotIndex === 0,
          rune_slot: slotIndex
        });
      });
    });
  }

  console.log(`Importando ${items.length} items...`);
  await supabase.from('items').upsert(items, { onConflict: 'item_id' });

  console.log(`Importando ${spells.length} hechizos...`);
  await supabase.from('spells').upsert(spells, { onConflict: 'spell_id' });

  console.log(`Importando ${runes.length} runas...`);
  await supabase.from('runes').upsert(runes, { onConflict: 'rune_id' });

  console.log('Datos importados correctamente.');
}

main();