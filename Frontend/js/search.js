const API_URL = 'https://lolstats-production-a058.up.railway.app/api';

const FALLBACK_ICON =
  'https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/29.png';

function showSearchError(message) {
  const errorBox = document.getElementById('search-error');

  if (!errorBox) return;

  errorBox.textContent = message;
  errorBox.classList.add('visible');
}

function clearSearchError() {
  const errorBox = document.getElementById('search-error');

  if (!errorBox) return;

  errorBox.textContent = '';
  errorBox.classList.remove('visible');
}

async function searchSummoner() {
  const summonerName = document.getElementById('summoner-name').value.trim();
  const selectedRegion = document.getElementById('region-select').value;

  clearSearchError();

  if (!summonerName) {
    showSearchError('Debes escribir el nombre del invocador.');
    return;
  }

  try {
    const response = await fetch(
      `https://lolstats-production-a058.up.railway.app/api/riot/summoner/${encodeURIComponent(summonerName)}`
    );

    const data = await response.json();
    console.log('Datos del invocador:', data);

    if (!response.ok) {
      showSearchError(data.error || 'Invocador no encontrado.');
      return;
    }

    const summoner = Array.isArray(data) ? data[0] : data;

    if (!summoner || !summoner.region) {
      showSearchError('No se encontró información válida para este invocador.');
      return;
    }

    if (summoner.region.toLowerCase() !== selectedRegion.toLowerCase()) {
      showSearchError(
        `Invocador no encontrado.`
      );
      return;
    }

    if (Array.isArray(data) && data.length > 1) {
      showSummonerList(data);
    } else if (Array.isArray(data) && data.length === 1) {
      showSummoner(data[0]);
    } else {
      showSummoner(data);
    }

  } catch (error) {
    console.error('Error:', error);
    showSearchError(error.message || 'No se encontró el invocador.');
  }
}

function renderBuildIcons(title, list, nameKey) {
  if (!list || list.length === 0) {
    return '';
  }

  return `
    <div class="match-build-group" aria-label="${title}" title="${title}">
      <div class="match-build-icons">
        ${list.map(entry => `
          <img
            src="${entry.image || FALLBACK_ICON}"
            alt="${entry[nameKey] || title}"
            title="${entry[nameKey] || title}"
            onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
          >
        `).join('')}
      </div>
    </div>
  `;
}

async function showMatchDetails(matchId) {
  try {
    const response = await fetch(
      `https://lolstats-production-a058.up.railway.app/api/riot/match/${matchId}`
    );

    if (!response.ok) {
      throw new Error('Error al obtener detalles de la partida');
    }

    const players = await response.json();

    const redTeam = players.filter(p => p.team === 'red');
    const blueTeam = players.filter(p => p.team === 'blue');

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('match-details');

    detailsContainer.innerHTML = `
      <div class="teams">
        <div class="team red-team">
          <h5>Equipo Rojo</h5>
          <ul>
            ${redTeam.map(p => `
              <li>
                <span>
                  <img
                    src="https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/${p.summoners?.profile_icon_id || 29}.png"
                    width="32"
                    onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
                  >
                  ${p.summoners?.name || 'Desconocido'}
                </span>

                <span class="champion-lane">
                  <img
                    class="champion-icon"
                    src="${p.champions?.image || FALLBACK_ICON}"
                    width="32"
                    title="${p.champions?.champion_name || p.champion_name || 'Campeón desconocido'}"
                    onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
                  >
                  <span class="lane">${p.lane || ''}</span>
                  <span class="kda">${p.kills || 0}/${p.deaths || 0}/${p.assists || 0}</span>
                </span>

                <div class="match-player-build">
                  ${renderBuildIcons('Items', p.items, 'item_name')}
                  ${renderBuildIcons('Principal', p.primaryRune ? [p.primaryRune] : [], 'rune_name')}
                  ${renderBuildIcons('Runas', p.primaryRunes, 'rune_name')}
                  ${renderBuildIcons('Secundarias', p.secondaryRunes, 'rune_name')}
                  ${renderBuildIcons('Hechizos', p.spells, 'spell_name')}
                </div>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="team blue-team">
          <h5>Equipo Azul</h5>
          <ul>
            ${blueTeam.map(p => `
              <li>
                <span>
                  <img
                    src="https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/${p.summoners?.profile_icon_id || 29}.png"
                    width="32"
                    onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
                  >
                  ${p.summoners?.name || 'Desconocido'}
                </span>

                <span class="champion-lane">
                  <img
                    class="champion-icon"
                    src="${p.champions?.image || FALLBACK_ICON}"
                    width="32"
                    title="${p.champions?.champion_name || p.champion_name || 'Campeón desconocido'}"
                    onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
                  >
                  <span class="lane">${p.lane || ''}</span>
                  <span class="kda">${p.kills || 0}/${p.deaths || 0}/${p.assists || 0}
                </span>

                <div class="match-player-build">
                  ${renderBuildIcons('Items', p.items, 'item_name')}
                  ${renderBuildIcons('Principal', p.primaryRune ? [p.primaryRune] : [], 'rune_name')}
                  ${renderBuildIcons('Runas', p.primaryRunes, 'rune_name')}
                  ${renderBuildIcons('Secundarias', p.secondaryRunes, 'rune_name')}
                  ${renderBuildIcons('Hechizos', p.spells, 'spell_name')}
                </div>
                </span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    const matchItem = document.querySelector(
      `.match-item[onclick="showMatchDetails('${matchId}')"]`
    );

    if (!matchItem) return;

    const existingDetails = matchItem.querySelector('.match-details');

    if (existingDetails) {
      existingDetails.remove();
    } else {
      matchItem.appendChild(detailsContainer);
    }

  } catch (error) {
    console.error(error);
    showSearchError(error.message || 'No se pudieron cargar los detalles de la partida.');
  }
}

function showSummoner(summoner) {
  const container = document.getElementById('summoner-result');

  const lastSeen = new Date(summoner.last_seen);
  const timeAgo = getTimeAgo(lastSeen);

  let matchesHTML = '';

  if (summoner.recentMatches && summoner.recentMatches.length > 0) {
    matchesHTML = `
      <div class="matches-list">
        <h3 class="matches-title">Historial de Partidas</h3>

        ${summoner.recentMatches.map(match => `
          <div class="match-item ${match.win ? 'win' : 'loss'}" onclick="showMatchDetails('${match.match_id}')">
            <div class="match-item-header">
              <span class="match-result ${match.win ? 'win' : 'loss'}">
                ${match.win ? 'V' : 'D'}
              </span>

              <img
                src="${match.champions?.image || FALLBACK_ICON}"
                alt="${match.champions?.champion_name || match.champion_name || 'Campeón desconocido'}"
                title="${match.champions?.champion_name || match.champion_name || 'Campeón desconocido'}"
                onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
              >
            </div>

            <div class="match-item-kda">
              ${match.kills}/${match.deaths}/${match.assists}
            </div>

            <div class="match-item-meta">
              <span>${match.game_mode || 'CLASSIC'}</span>
              <span>${match.game_duration}'</span>
              <span>${match.lane || match.role || ''}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="summoner-layout">
      ${matchesHTML}

      <div class="summoner-main">
        <div class="summoner-card">
          <img
            src="https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/${summoner.profile_icon_id || 29}.png"
            width="120"
            alt="${summoner.name}"
            onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
          >

          <h2>${summoner.name}${summoner.tag_line ? '#' + summoner.tag_line : ''}</h2>

          <button
            id="favorite-button"
            class="favorite-button"
            onclick="toggleFavorite(${summoner.id})"
          >
            Favorito
          </button>

          <p class="summoner-level">Nivel: ${summoner.level}</p>
          <p class="summoner-region">Región: ${summoner.region.toUpperCase()}</p>
          <p class="summoner-lastseen">Última conexión: ${timeAgo}</p>

          ${showRankedInfo(summoner)}
        </div>
      </div>
    </div>
  `;
}

function showRankedInfo(summoner) {
  let html = '<div class="ranked-section">';

  if (summoner.soloq_tier) {
    const soloWins = summoner.soloq_wins || 0;
    const soloLosses = summoner.soloq_losses || 0;
    const soloTotal = soloWins + soloLosses;
    const soloWR = soloTotal > 0 ? Math.round((soloWins / soloTotal) * 100) : 0;

    html += `
      <div class="ranked-info solo">
        <h4>Solo/Duo Queue</h4>
        <h3>${summoner.soloq_tier} ${summoner.soloq_rank || ''}</h3>
        <p class="lp">${summoner.soloq_lp || 0} LP</p>
        <p class="wins-losses">${soloWins}W - ${soloLosses}L</p>
        <p class="total-games">${soloTotal} partidas</p>
        <p class="wr">${soloWR}% WR</p>
      </div>
    `;
  } else {
    html += `
      <div class="ranked-info">
        <h4>Solo/Duo Queue</h4>
        <p>Sin rango</p>
      </div>
    `;
  }

  if (summoner.flex_tier) {
    const flexWins = summoner.flex_wins || 0;
    const flexLosses = summoner.flex_losses || 0;
    const flexTotal = flexWins + flexLosses;
    const flexWR = flexTotal > 0 ? Math.round((flexWins / flexTotal) * 100) : 0;

    html += `
      <div class="ranked-info flex">
        <h4>Flex Queue</h4>
        <h3>${summoner.flex_tier} ${summoner.flex_rank || ''}</h3>
        <p class="lp">${summoner.flex_lp || 0} LP</p>
        <p class="wins-losses">${flexWins}W - ${flexLosses}L</p>
        <p class="total-games">${flexTotal} partidas</p>
        <p class="wr">${flexWR}% WR</p>
      </div>
    `;
  } else {
    html += `
      <div class="ranked-info">
        <h4>Flex Queue</h4>
        <p>Sin rango</p>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

function showSummonerSingle(summoner) {
  showSummoner(summoner);
}

function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Hace pocos segundos';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;

  return `Hace ${Math.floor(diffInSeconds / 604800)} semanas`;
}

async function toggleFavorite(summonerId) {
  const userId = localStorage.getItem('user_id');

  if (!userId) {
    showSearchError('Debes iniciar sesión para guardar favoritos.');
    return;
  }

  const button = document.getElementById('favorite-button');
  const isFavorite = button.classList.contains('active');

  const response = await fetch(`${API_URL}/favorites`, {
    method: isFavorite ? 'DELETE' : 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      summoner_id: summonerId
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(data);
    showSearchError(data.error || 'No se pudo actualizar favoritos.');
    return;
  }

  button.classList.toggle('active');
  button.textContent = isFavorite ? 'Favorito' : 'Favorito guardado';
}

function loadSummonerFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const summonerName = params.get('summoner');
  const region = params.get('region');

  if (!summonerName) return;

  const summonerInput = document.getElementById('summoner-name');
  const regionSelect = document.getElementById('region-select');

  if (summonerInput) {
    summonerInput.value = summonerName;
  }

  if (regionSelect && region) {
    regionSelect.value = region;
  }

  searchSummoner();
}

loadSummonerFromUrl();