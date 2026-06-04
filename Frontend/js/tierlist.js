const API_URL =
'https://lolstats-production-a058.up.railway.app/api';

let allChampions = [];
let currentSort = 'tier';
let currentRole = 'all';

async function loadTierList() {
  try {
    const response = await fetch(`${API_URL}/tierlist`);
    const data = await response.json();

    console.log(data);

    if (!response.ok) {
      console.error('Error cargando tierlist:', data);
      return;
    }

    if (!Array.isArray(data)) {
      console.error('La respuesta de tierlist no es un array:', data);
      return;
    }

    allChampions = data;

    renderTierList();

  } catch(error) {
    console.error(error);
  }
}

function setTierSort(sortType) {
  currentSort = sortType;
  renderTierList();
}

function setRoleFilter(role) {
  currentRole = role;
  renderTierList();
}

function renderTierList() {
  let champions = [...allChampions];

  if (currentRole !== 'all') {
    champions = champions.filter(champion => {
      return champion.role === currentRole;
    });
  }

  const tierOrder = {
    S: 1,
    A: 2,
    B: 3,
    C: 4,
    D: 5
  };

  if (currentSort === 'tier') {
    champions.sort((a, b) => {
      return tierOrder[a.tier] - tierOrder[b.tier];
    });
  }

  if (currentSort === 'asc') {
    champions.sort((a, b) => {
      return Number(a.winrate || a.win_rate || 0) - Number(b.winrate || b.win_rate || 0);
    });
  }

  if (currentSort === 'desc') {
    champions.sort((a, b) => {
      return Number(b.winrate || b.win_rate || 0) - Number(a.winrate || a.win_rate || 0);
    });
  }

  if (currentSort === 'alpha') {
    champions.sort((a, b) => {
      const nameA = a.champions?.champion_name || '';
      const nameB = b.champions?.champion_name || '';

      return nameA.localeCompare(nameB);
    });
  }

  showTierList(champions);
}

function showTierList(champions) {

  const container =
  document.getElementById('tierlist-content');

  container.innerHTML = '';

  champions.forEach(champion => {

    const card =
    document.createElement('div');

    card.classList.add('tier-card', `tier-card-${champion.tier}`);

    card.innerHTML = `

  <div class="tier-badge tier-${String(champion.tier).trim().toUpperCase()}">
  ${String(champion.tier).trim().toUpperCase()}
  </div>

  <img
  src="${champion.champions.image || 'https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/29.png'}"
  alt="${champion.champions.champion_name}"
  onerror="this.src='https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/29.png'"
  >

  <h3>
    ${champion.champions.champion_name}
  </h3>

  <div class="tier-stats">

    <div class="stat-row">
      <span>Win Rate</span>
      <strong>${champion.winrate}%</strong>
    </div>

    <div class="stat-row">
      <span>Pick Rate</span>
      <strong>${champion.pickrate}%</strong>
    </div>

    <div class="stat-row">
      <span>Pick Rate</span>
      <strong>${champion.banrate}%</strong>
    </div>

  </div>

  <div class="role-tag">
    ${champion.role}
  </div>

`;

    container.appendChild(card);

  });

}

loadTierList();