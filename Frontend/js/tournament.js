let tournamentTeams = [];
let currentBracket = null;

function showTeamForm() {
  const count = Number(document.getElementById('participant-count').value);
  const teamsForm = document.getElementById('teams-form');

  teamsForm.innerHTML = '';

  for (let i = 1; i <= count; i++) {
    teamsForm.innerHTML += `
      <input
        class="tournament-input"
        id="team-${i}"
        placeholder="Equipo ${i}"
      >
    `;
  }

  document.getElementById('step-teams').classList.remove('hidden');
}

function confirmTeams() {
  const count = Number(document.getElementById('participant-count').value);
  const teams = [];

  for (let i = 1; i <= count; i++) {
    const input = document.getElementById(`team-${i}`);
    const name = input.value.trim();

    if (!name) {
      alert(`Falta el nombre del equipo ${i}`);
      return;
    }

    teams.push(name);
  }

  tournamentTeams = teams;

  document.getElementById('step-mode').classList.remove('hidden');
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function generateRandomBracket() {
  const shuffledTeams = shuffle(tournamentTeams);
  const matches = createFirstRound(shuffledTeams);

  currentBracket = createBracket(matches);
  renderBracket(currentBracket);
  saveTournament(currentBracket);
}

function showManualOrganizer() {
  const container = document.getElementById('manual-organizer');

  container.classList.remove('hidden');
  container.innerHTML = '';

  const count = tournamentTeams.length / 2;

  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <div class="manual-match">
        <select class="manual-team">
          ${tournamentTeams.map(team => `<option value="${team}">${team}</option>`).join('')}
        </select>

        <span>vs</span>

        <select class="manual-team">
          ${tournamentTeams.map(team => `<option value="${team}">${team}</option>`).join('')}
        </select>
      </div>
    `;
  }

  container.innerHTML += `
    <button class="tournament-button" onclick="confirmManualBracket()">
      Confirmar enfrentamientos
    </button>
  `;
}

function confirmManualBracket() {
  const selects = [...document.querySelectorAll('.manual-team')];
  const selectedTeams = selects.map(select => select.value);
  const uniqueTeams = new Set(selectedTeams);

  if (uniqueTeams.size !== tournamentTeams.length) {
    alert('No puedes repetir equipos. Todos deben aparecer una sola vez.');
    return;
  }

  const matches = [];

  for (let i = 0; i < selectedTeams.length; i += 2) {
    matches.push({
      teamA: selectedTeams[i],
      teamB: selectedTeams[i + 1]
    });
  }

  currentBracket = createBracket(matches);
  renderBracket(currentBracket);
  saveTournament(currentBracket);
}

function createFirstRound(teams) {
  const matches = [];

  for (let i = 0; i < teams.length; i += 2) {
    matches.push({
      teamA: teams[i],
      teamB: teams[i + 1]
    });
  }

  return matches;
}

function createBracket(firstRoundMatches) {
  const rounds = [];

  rounds.push(firstRoundMatches.map((match, index) => ({
    matchId: `R1-M${index + 1}`,
    teamA: match.teamA,
    teamB: match.teamB,
    winner: null
  })));

  let previousRoundSize = firstRoundMatches.length;
  let roundNumber = 2;

  while (previousRoundSize > 1) {
    const round = [];

    for (let i = 0; i < previousRoundSize / 2; i++) {
      round.push({
        matchId: `R${roundNumber}-M${i + 1}`,
        teamA: `Ganador R${roundNumber - 1}-M${i * 2 + 1}`,
        teamB: `Ganador R${roundNumber - 1}-M${i * 2 + 2}`,
        winner: null
      });
    }

    rounds.push(round);
    previousRoundSize = round.length;
    roundNumber++;
  }

  return rounds;
}

function renderBracket(bracket) {
  const bracketContainer = document.getElementById('bracket');

  document.getElementById('step-bracket').classList.remove('hidden');

  bracketContainer.innerHTML = bracket.map((round, roundIndex) => `
    <div class="bracket-round">
      <h3>${getRoundName(roundIndex, bracket.length)}</h3>

      ${round.map(match => `
        <div class="bracket-match">
          <div>${match.teamA}</div>
          <div>${match.teamB}</div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function getRoundName(index, totalRounds) {
  if (index === totalRounds - 1) return 'Final';
  if (index === totalRounds - 2) return 'Semifinal';
  if (index === totalRounds - 3) return 'Cuartos';
  return `Ronda ${index + 1}`;
}

async function saveTournament(bracket) {
  const nameInput = document.getElementById('tournament-name');
  const tournamentName = nameInput.value.trim() || 'Torneo sin nombre';

  const { data: userData, error: userError } = await supabase.auth.getUser();

  console.log('Auth user id:', userData.user.id);

  if (userError || !userData.user) {
    alert('Debes iniciar sesión para guardar torneos.');
    return;
  }

  const { error } = await supabase
    .from('tournaments')
    .insert({
      user_id: userData.user.id,
      name: tournamentName,
      participant_count: tournamentTeams.length,
      teams: tournamentTeams,
      bracket
    });

  if (error) {
    console.error(error);
    alert('No se pudo guardar el torneo.');
    return;
  }

  loadSavedTournaments();
}

async function loadSavedTournaments() {
  const container = document.getElementById('saved-tournaments');

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    container.innerHTML = `
      <p class="tournament-empty">Inicia sesión para ver tus torneos.</p>
    `;
    return;
  }

  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando torneos:', error);
    container.innerHTML = `
      <p class="tournament-empty">No se pudieron cargar tus torneos.</p>
    `;
    return;
  }

  if (!data.length) {
    container.innerHTML = `
      <p class="tournament-empty">Todavía no tienes torneos guardados.</p>
    `;
    return;
  }

  container.innerHTML = data.map(tournament => `
    <button
      class="saved-tournament"
      onclick='renderBracket(${JSON.stringify(tournament.bracket)})'
    >
      <strong>${tournament.name}</strong>
      <span>${tournament.participant_count} equipos</span>
    </button>
  `).join('');
}

loadSavedTournaments();