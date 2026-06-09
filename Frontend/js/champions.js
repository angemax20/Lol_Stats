const API_URL = 'https://lolstats-production-a058.up.railway.app/api';
let allChampions = [];

const FALLBACK_ICON =
  'https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/29.png';

async function loadChampions() {
  try {
    const response = await fetch(`${API_URL}/champions`);
    const champions = await response.json();

    if (!response.ok) {
      console.error(champions);
      return;
    }

    allChampions = champions;
    showChampions(allChampions);
    setupChampionSearch();
  } catch (error) {
    console.error('Error cargando campeones:', error);
  }
}

function setupChampionSearch() {
  const input = document.getElementById('champion-search');

  if (!input) return;

  input.addEventListener('input', () => {
    const searchTerm = input.value.trim().toLowerCase();

    const filteredChampions = allChampions.filter(champion => {
      return champion.champion_name.toLowerCase().includes(searchTerm);
    });

    showChampions(filteredChampions);
  });
}

function showChampions(champions) {
  const grid = document.getElementById('champions-grid');

  grid.innerHTML = champions.map(champion => `
    <button
      class="champion-gallery-card"
      onclick="loadChampionBuild(${champion.champion_id})"
    >
      <img
        src="${champion.image || FALLBACK_ICON}"
        alt="${champion.champion_name}"
        onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
      >

      <span>${champion.champion_name}</span>
    </button>
  `).join('');
}

async function loadChampionBuild(championId) {
  try {
    const response = await fetch(`${API_URL}/champions/${championId}/build`);
    const build = await response.json();

    if (!response.ok) {
      showBuildModal(`
        <h2>Build no disponible</h2>
        <p class="build-empty">${build.error || 'Este campeón todavía no tiene build recomendada.'}</p>
      `);
      return;
    }

    renderBuild(build);
  } catch (error) {
    console.error('Error cargando build:', error);

    showBuildModal(`
      <h2>Error</h2>
      <p class="build-empty">No se pudo cargar la build del campeón.</p>
    `);
  }
}

function renderBuild(build) {
  const champion = build.champions;

  const items = build.build_items || [];
  const runes = build.build_runes || [];
  const spells = build.build_spells || [];

  showBuildModal(`
    <div class="build-header">
      <img
        src="${champion?.image || FALLBACK_ICON}"
        alt="${champion?.champion_name || 'Campeón'}"
        onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
      >

      <div>
        <h2>${champion?.champion_name || 'Campeón'}</h2>
        <p>${champion?.champion_title || ''}</p>
        <span>${build.role || 'Rol no definido'}</span>
      </div>
    </div>

    <section class="build-section">
      <h3>Objetos</h3>
      <div class="build-icons">
        ${items.map(row => `
          <div class="build-icon">
            <img
              src="${row.items?.image || FALLBACK_ICON}"
              alt="${row.items?.item_name || 'Objeto'}"
              title="${row.items?.item_name || 'Objeto'}"
              onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
            >
            <small>${row.items?.item_name || 'Objeto'}</small>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="build-section">
      <h3>Runas</h3>
      <div class="build-icons">
        ${runes.map(row => `
          <div class="build-icon">
            <img
              src="${row.runes?.image || FALLBACK_ICON}"
              alt="${row.runes?.rune_name || 'Runa'}"
              title="${row.runes?.rune_name || 'Runa'}"
              onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
            >
            <small>${row.runes?.rune_name || 'Runa'}</small>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="build-section">
      <h3>Hechizos</h3>
      <div class="build-icons">
        ${spells.map(row => `
          <div class="build-icon">
            <img
              src="${row.spells?.image || FALLBACK_ICON}"
              alt="${row.spells?.spell_name || 'Hechizo'}"
              title="${row.spells?.spell_name || 'Hechizo'}"
              onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
            >
            <small>${row.spells?.spell_name || 'Hechizo'}</small>
          </div>
        `).join('')}
      </div>
    </section>
  `);
}

function showBuildModal(html) {
  const modal = document.getElementById('build-modal');
  const content = document.getElementById('build-content');

  content.innerHTML = html;
  modal.classList.add('visible');
}

function closeBuildModal() {
  const modal = document.getElementById('build-modal');

  modal.classList.remove('visible');
}

loadChampions();