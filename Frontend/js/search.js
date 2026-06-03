const FALLBACK_ICON =
  'https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/29.png';

async function searchSummoner() {
  const summonerName = document.getElementById('summoner-name').value.trim();
  const selectedRegion = document.getElementById('region-select').value; // región del desplegable

  if (!summonerName) {
    alert('Debes escribir el nombre del invocador');
    return;
  }

  try {
    const response = await fetch(
      `https://lolstats-production-a058.up.railway.app/api/riot/summoner/${encodeURIComponent(summonerName)}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al buscar invocador');
    }

    const data = await response.json();
    console.log('Datos del invocador:', data);

    // Validar región
    const summoner = Array.isArray(data) ? data[0] : data;
    if (summoner.region.toLowerCase() !== selectedRegion.toLowerCase()) {
      alert(`El invocador existe pero está en la región ${summoner.region}, no en ${selectedRegion}`);
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
    alert(error.message || 'Error al buscar el invocador');
  }
}


async function showMatchDetails(matchId) {
  try {
    const response = await fetch(`https://lolstats-production-a058.up.railway.app/api/riot/match/${matchId}`);
    if (!response.ok) {
      throw new Error('Error al obtener detalles de la partida');
    }

    const players = await response.json();

    // Separar por equipo
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
              onerror="this.onerror=null; this.src='${FALLBACK_ICON}'">
              ${p.summoners?.name || 'Desconocido'} 
            </span>
            <span class="champion-lane">
              <img
              class="champion-icon"
              src="${p.champions?.image || FALLBACK_ICON}"
              width="32"
              title="${p.champions?.champion_name || p.champion_name || 'Campeón desconocido'}"
              onerror="this.onerror=null; this.src='${FALLBACK_ICON}'">
              <span class="lane">${p.lane || ''}</span>
              <span class="kda">${p.kills || 0}/${p.deaths || 0}/${p.assists || 0}</span>
            </span>
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
              onerror="this.onerror=null; this.src='${FALLBACK_ICON}'">
              ${p.summoners?.name || 'Desconocido'} 
            </span>
            <span class="champion-lane">
              <img
              class="champion-icon"
              src="${p.champions?.image || FALLBACK_ICON}"
              width="32"
              title="${p.champions?.champion_name || p.champion_name || 'Campeón desconocido'}"
              onerror="this.onerror=null; this.src='${FALLBACK_ICON}'">
              <span class="lane">${p.lane || ''}</span>
              <span class="kda">${p.kills || 0}/${p.deaths || 0}/${p.assists || 0}</span>
            </span>
          </li>
        `).join('')}
      </ul>
    </div>
  </div>
`;




    const matchItem = document.querySelector(`.match-item[onclick="showMatchDetails('${matchId}')"]`);
    const existingDetails = matchItem.querySelector('.match-details');
    if (existingDetails) {
      existingDetails.remove();
    } else {
      matchItem.appendChild(detailsContainer);
    }

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}




function showSummoner(summoner) {
  const container = document.getElementById('summoner-result');

  const lastSeen = new Date(summoner.last_seen);
  const timeAgo = getTimeAgo(lastSeen);

  // Mostrar historial de partidas
  let matchesHTML = '';
if (summoner.recentMatches && summoner.recentMatches.length > 0) {
  matchesHTML = `
    <div class="matches-list">
      <h3 class="matches-title"> Historial de Partidas</h3>
      ${summoner.recentMatches.map((match, index) => `
        <div class="match-item ${match.win ? 'win' : 'loss'}" onclick="showMatchDetails('${match.match_id}')">
          <div class="match-item-header">
            <span class="match-result ${match.win ? 'win' : 'loss'}">
              ${match.win ? 'V' : 'D'}
            </span>
            <img src="${match.champions?.image || FALLBACK_ICON}"
            alt="${match.champions?.champion_name || match.champion_name || 'Campeón desconocido'}"
            title="${match.champions?.champion_name || match.champion_name || 'Campeón desconocido'}"
            onerror="this.onerror=null; this.src='${FALLBACK_ICON}'">
          </div>
          <div class="match-item-kda">
            ${match.kills}/${match.deaths}/${match.assists}
          </div>
          <div class="match-item-meta">
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

  // SOLOQ
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

  // FLEX
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

