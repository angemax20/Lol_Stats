const API_URL =
'https://lolstats-production-a058.up.railway.app/api';

async function loadTierList() {

  try {

    const response =
    await fetch(`${API_URL}/tierlist`);

    const data =
    await response.json();

    console.log(data);

    if (!response.ok) {
      console.error('Error cargando tierlist:', data);
      return;
    }

    if (!Array.isArray(data)) {
      console.error('La respuesta de tierlist no es un array:', data);
      return;
    }

    showTierList(data);

  } catch(error) {

    console.error(error);

  }

}

function showTierList(champions) {

  const container =
  document.getElementById('tierlist-content');

  container.innerHTML = '';

  champions.forEach(champion => {

    const card =
    document.createElement('div');

    card.classList.add('tier-card');

    card.innerHTML = `

  <div class="tier-badge tier-${champion.tier}">
    ${champion.tier}
  </div>

  <img
  src="https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${champion.champions.champion_name}.png"
  >

  <h3>
    ${champion.champions.champion_name}
  </h3>

  <p class="champion-title">
    ${champion.champions.champion_title}
  </p>

  <div class="tier-stats">

    <div class="stat-row">
      <span>Win Rate</span>
      <strong>${champion.win_rate}%</strong>
    </div>

    <div class="stat-row">
      <span>Pick Rate</span>
      <strong>${champion.pick_rate}%</strong>
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