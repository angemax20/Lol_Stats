const API_URL = 'https://lolstats-production-a058.up.railway.app/api';

const FALLBACK_ICON =
  'https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/29.png';

async function loadFavorites() {
  const userId = localStorage.getItem('user_id');
  const container = document.getElementById('favorites-list');

  if (!userId) {
    container.innerHTML = `
      <p class="favorites-empty">Inicia sesión para ver tus favoritos.</p>
    `;
    return;
  }

  const response = await fetch(`${API_URL}/favorites/${userId}`);
  const text = await response.text();

    let data;

    try {
    data = JSON.parse(text);
    } catch {
    console.error('Respuesta no JSON:', text);
    container.innerHTML = `
        <p class="favorites-empty">
            No se pudo conectar con la ruta de favoritos.
        </p>
        `;
    return;
    }

  if (!response.ok) {
    console.error(data);
    container.innerHTML = `
      <p class="favorites-empty">No se pudieron cargar tus favoritos.</p>
    `;
    return;
  }

  if (!data.length) {
    container.innerHTML = `
      <p class="favorites-empty">Todavía no tienes invocadores favoritos.</p>
    `;
    return;
  }

  container.innerHTML = data.map(row => {
    const summoner = row.summoners;

    return `
      <article class="favorite-card">
        <img
          src="https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/${summoner.profile_icon_id || 29}.png"
          alt="${summoner.name}"
          onerror="this.onerror=null; this.src='${FALLBACK_ICON}'"
        >

        <div>
          <h3>${summoner.name}${summoner.tag_line ? '#' + summoner.tag_line : ''}</h3>
          <p>${summoner.region} · Nivel ${summoner.level}</p>
          <strong>${summoner.soloq_tier || 'Sin rango'} ${summoner.soloq_rank || ''} · ${summoner.soloq_lp || 0} LP</strong>
        </div>

        <button onclick="removeFavorite(${summoner.id})">
          Quitar
        </button>
      </article>
    `;
  }).join('');
}

async function removeFavorite(summonerId) {
  const userId = localStorage.getItem('user_id');

  const response = await fetch(`${API_URL}/favorites`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      summoner_id: summonerId
    })
  });

  if (!response.ok) {
    const data = await response.json();
    console.error(data);
    return;
  }

  loadFavorites();
}

loadFavorites();