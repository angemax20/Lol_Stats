const API_URL = 'https://lolstats-production-a058.up.railway.app/api';

const FALLBACK_ICON =
  'https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/29.png';

let allLeaderboardSummoners = [];

async function loadLeaderboard() {
  try {
    const tierSelect = document.getElementById('leaderboard-tier');
    const regionSelect = document.getElementById('leaderboard-region');

    const selectedTier = tierSelect ? tierSelect.value : 'Retador';
    const selectedRegion = regionSelect ? regionSelect.value : 'all';

    const response = await fetch(
      `${API_URL}/leaderboard?tier=${encodeURIComponent(selectedTier)}&region=${encodeURIComponent(selectedRegion)}`
    );
    const summoners = await response.json();

    if (!response.ok) {
      console.error(summoners);
      showLeaderboardError('No se pudo cargar la leaderboard.');
      return;
    }

    allLeaderboardSummoners = summoners;
    applyLeaderboardSearch();
    setupLeaderboardSearch();
  } catch (error) {
    console.error(error);
    showLeaderboardError('Error cargando la leaderboard.');
  }
}

function showLeaderboard(summoners) {
  const list = document.getElementById('leaderboard-list');

  if (!summoners.length) {
    const tierSelect = document.getElementById('leaderboard-tier');
    const selectedTier = tierSelect ? tierSelect.value : 'Retador';

    list.innerHTML = `
      <p class="leaderboard-empty">
        No hay invocadores ${selectedTier} registrados.
      </p>
    `;
    return;
  }

  list.innerHTML = summoners.map((summoner, index) => {
    const wins = summoner.soloq_wins || 0;
    const losses = summoner.soloq_losses || 0;
    const totalGames = wins + losses;
    const winrate = totalGames > 0
      ? Math.round((wins / totalGames) * 100)
      : 0;

    return `
      <div class="leaderboard-row">
        <div class="leaderboard-rank">
          ${index + 1}
        </div>

        <div class="leaderboard-summoner">
          <img
            src="https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/${summoner.profile_icon_id || 29}.png"
            alt="${summoner.name}"
            onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
          >

          <div>
            <strong>${summoner.name}${summoner.tag_line ? '#' + summoner.tag_line : ''}</strong>
            <span>Nivel ${summoner.level || 0}</span>
          </div>
        </div>

        <div class="leaderboard-region">
          ${summoner.region || 'N/A'}
        </div>

        <div class="leaderboard-rank-label">
          ${summoner.soloq_tier || 'Sin rango'} ${summoner.soloq_rank || ''}
        </div>

        <div class="leaderboard-lp">
          ${summoner.soloq_lp || 0} LP
        </div>

        <div class="leaderboard-winrate">
          ${winrate}% WR
        </div>
      </div>
    `;
  }).join('');
}

function showLeaderboardError(message) {
  const list = document.getElementById('leaderboard-list');

  list.innerHTML = `
    <p class="leaderboard-empty">
      ${message}
    </p>
  `;
}

function setupLeaderboardSearch() {
  const input = document.getElementById('leaderboard-search');

  if (!input) return;

  input.oninput = applyLeaderboardSearch;
}

function applyLeaderboardSearch() {
  const input = document.getElementById('leaderboard-search');
  const searchTerm = input ? input.value.trim().toLowerCase() : '';

  const filteredSummoners = allLeaderboardSummoners.filter(summoner => {
    const fullName = `${summoner.name || ''}${summoner.tag_line ? '#' + summoner.tag_line : ''}`.toLowerCase();

    return fullName.includes(searchTerm);
  });

  showLeaderboard(filteredSummoners);
}

loadLeaderboard();