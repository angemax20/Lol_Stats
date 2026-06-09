let tournamentTeams = [];
let currentBracket = null;
let openedSavedTournamentId = null;

function showOnlyStep(stepId) {
  const steps = [
    'step-size',
    'step-teams',
    'step-mode',
    'step-bracket'
  ];

  steps.forEach(id => {
    const element = document.getElementById(id);

    if (!element) return;

    if (id === stepId) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
  });
}

function goBackToSize() {
  tournamentTeams = [];
  currentBracket = null;
  openedSavedTournamentId = null;

  document.getElementById('teams-form').innerHTML = '';
  document.getElementById('manual-organizer').innerHTML = '';
  document.getElementById('bracket').innerHTML = '';

  showOnlyStep('step-size');
}

function goBackToTeams() {
  currentBracket = null;
  openedSavedTournamentId = null;

  document.getElementById('manual-organizer').innerHTML = '';
  document.getElementById('manual-organizer').classList.add('hidden');
  document.getElementById('bracket').innerHTML = '';

  showOnlyStep('step-teams');
}

function goBackToMode() {
  currentBracket = null;
  openedSavedTournamentId = null;

  document.getElementById('bracket').innerHTML = '';

  showOnlyStep('step-mode');
}

function closeBracket() {
  currentBracket = null;
  openedSavedTournamentId = null;

  const bracket = document.getElementById('bracket');

  if (bracket) bracket.innerHTML = '';

  showOnlyStep('step-size');
}

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

  showOnlyStep('step-teams');
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

  showOnlyStep('step-mode');
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
  <div class="tournament-actions">
    <button class="tournament-button" onclick="confirmManualBracket()">
      Confirmar enfrentamientos
    </button>

    <button class="tournament-button" onclick="cancelTournamentCreation()">
      Cancelar
    </button>
  </div>
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
    sourceA: null,
    sourceB: null,
    lockedA: false,
    lockedB: false
  })));

  let previousRoundSize = firstRoundMatches.length;
  let roundNumber = 2;

  while (previousRoundSize > 1) {
    const round = [];

    for (let i = 0; i < previousRoundSize / 2; i++) {
      round.push({
        matchId: `R${roundNumber}-M${i + 1}`,
        teamA: '',
        teamB: '',
        sourceA: null,
        sourceB: null,
        lockedA: false,
        lockedB: false
      });
    }

    rounds.push(round);
    previousRoundSize = round.length;
    roundNumber++;
  }

  rounds.push([
    {
      matchId: 'WINNER',
      teamA: '',
      teamB: '',
      sourceA: null,
      sourceB: null,
      lockedA: false,
      lockedB: false
    }
  ]);

  return rounds;
}

function renderBracket(bracket) {
  const bracketContainer = document.getElementById('bracket');

  if (!bracketContainer) return;

  currentBracket = bracket;

  showOnlyStep('step-bracket');

  bracketContainer.innerHTML = bracket.map((round, roundIndex) => `
    <div class="bracket-round">
      <h3>${getRoundName(roundIndex, bracket.length)}</h3>

      ${round.map((match, matchIndex) => `
        <div class="bracket-match">
          ${renderTeamSlot(roundIndex, matchIndex, 'A', match.teamA, match.lockedA)}
          ${match.matchId === 'WINNER'
            ? ''
            : renderTeamSlot(roundIndex, matchIndex, 'B', match.teamB, match.lockedB)}
        </div>
      `).join('')}
    </div>
  `).join('');
}

function getRoundName(index, totalRounds) {
  const winnerIndex = totalRounds - 1;
  const finalIndex = totalRounds - 2;
  const semifinalIndex = totalRounds - 3;
  const quarterIndex = totalRounds - 4;

  if (index === winnerIndex) return 'Ganador';
  if (index === finalIndex) return 'Final';
  if (index === semifinalIndex) return 'Semifinal';
  if (index === quarterIndex) return 'Cuartos';

  return `Ronda ${index + 1}`;
}

async function saveTournament(bracket) {
  const nameInput = document.getElementById('tournament-name');
  const tournamentName = nameInput.value.trim() || 'Torneo sin nombre';

  const userId = localStorage.getItem('user_id');

  if (!userId) {
    alert('Debes iniciar sesión para guardar torneos.');
    return;
  }

  const response = await fetch('https://lolstats-production-a058.up.railway.app/api/tournaments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      name: tournamentName,
      participant_count: tournamentTeams.length,
      teams: tournamentTeams,
      bracket
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(data);
    alert(data.error || 'No se pudo guardar el torneo.');
    return;
  }

  loadSavedTournaments();
}

async function loadSavedTournaments() {
  const container = document.getElementById('saved-tournaments');
  const userId = localStorage.getItem('user_id');

  if (!userId) {
    container.innerHTML = `
      <p class="tournament-empty">Inicia sesión para ver tus torneos.</p>
    `;
    return;
  }

  const response = await fetch(
    `https://lolstats-production-a058.up.railway.app/api/tournaments/${userId}`
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(data);
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
  <div class="saved-tournament">
    <button
      class="saved-tournament-open"
      onclick='toggleSavedTournament("${tournament.id}", ${JSON.stringify(tournament.bracket)})'
    >
      <strong>${tournament.name}</strong>
      <span>${tournament.participant_count} equipos</span>
    </button>

    <button
      class="tournament-delete-button"
      onclick="deleteTournament('${tournament.id}')"
    >
      Eliminar
    </button>
  </div>
`).join('');
}

function cancelTournamentCreation() {
  tournamentTeams = [];
  currentBracket = null;
  openedSavedTournamentId = null;

  const tournamentName = document.getElementById('tournament-name');
  const teamsForm = document.getElementById('teams-form');
  const manualOrganizer = document.getElementById('manual-organizer');
  const bracket = document.getElementById('bracket');

  if (tournamentName) tournamentName.value = '';
  if (teamsForm) teamsForm.innerHTML = '';
  if (manualOrganizer) {
    manualOrganizer.innerHTML = '';
    manualOrganizer.classList.add('hidden');
  }
  if (bracket) bracket.innerHTML = '';

  showOnlyStep('step-size');
}

async function deleteTournament(tournamentId) {
  const userId = localStorage.getItem('user_id');

  if (!userId) {
    alert('Debes iniciar sesión para eliminar torneos.');
    return;
  }

  const confirmed = confirm('¿Seguro que quieres eliminar este torneo?');

  if (!confirmed) return;

  const response = await fetch(
    `https://lolstats-production-a058.up.railway.app/api/tournaments/${tournamentId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(data);
    alert(data.error || 'No se pudo eliminar el torneo.');
    return;
  }
  closeBracket();
  loadSavedTournaments();
}

function toggleSavedTournament(tournamentId, bracket) {
  if (openedSavedTournamentId === tournamentId) {
    closeBracket();
    return;
  }

  openedSavedTournamentId = tournamentId;
  renderBracket(bracket);
}

function renderTeamSlot(roundIndex, matchIndex, slot, teamName, locked) {
  const disabled = !teamName ? 'disabled' : '';
  const lockedClass = locked ? 'locked' : '';

  return `
    <button
      class="bracket-team ${lockedClass}"
      ${disabled}
      onclick="openTeamActions(${roundIndex}, ${matchIndex}, '${slot}')"
    >
      ${teamName || 'Pendiente'}
    </button>
  `;
}

function openTeamActions(roundIndex, matchIndex, slot) {
  const match = currentBracket[roundIndex][matchIndex];
  const team = slot === 'A' ? match.teamA : match.teamB;
  const locked = slot === 'A' ? match.lockedA : match.lockedB;

  if (!team || locked) return;

  const canAdvance = roundIndex < currentBracket.length - 1;
  const canReturn = roundIndex > 0;

  const actions = [];

  if (canAdvance) {
    actions.push('1. Pasar');
  }

  if (canReturn) {
    actions.push('2. Devolver');
  }

  const choice = prompt(
    `${team}\n\n${actions.join('\n')}\n\nEscribe 1 o 2`
  );

  if (choice === '1' && canAdvance) {
    advanceTeam(roundIndex, matchIndex, slot);
  }

  if (choice === '2' && canReturn) {
    returnTeam(roundIndex, matchIndex, slot);
  }
}

function advanceTeam(roundIndex, matchIndex, slot) {
  const currentMatch = currentBracket[roundIndex][matchIndex];
  const team = slot === 'A' ? currentMatch.teamA : currentMatch.teamB;

  const nextRoundIndex = roundIndex + 1;
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const nextSlot = matchIndex % 2 === 0 ? 'A' : 'B';
  const nextMatch = currentBracket[nextRoundIndex][nextMatchIndex];

  const nextTeamKey = nextSlot === 'A' ? 'teamA' : 'teamB';
  const nextSourceKey = nextSlot === 'A' ? 'sourceA' : 'sourceB';

  if (nextMatch[nextTeamKey]) {
    alert('Ese espacio de la siguiente fase ya está ocupado.');
    return;
  }

  nextMatch[nextTeamKey] = team;
  nextMatch[nextSourceKey] = {
    roundIndex,
    matchIndex,
    slot
  };

  if (slot === 'A') {
    currentMatch.lockedA = true;
  } else {
    currentMatch.lockedB = true;
  }

  renderBracket(currentBracket);
  saveCurrentBracketProgress();
}

function returnTeam(roundIndex, matchIndex, slot) {
  const currentMatch = currentBracket[roundIndex][matchIndex];

  const teamKey = slot === 'A' ? 'teamA' : 'teamB';
  const sourceKey = slot === 'A' ? 'sourceA' : 'sourceB';

  const source = currentMatch[sourceKey];

  if (!source) {
    alert('Este equipo no tiene fase anterior registrada.');
    return;
  }

  const sourceMatch = currentBracket[source.roundIndex][source.matchIndex];

  if (source.slot === 'A') {
    sourceMatch.lockedA = false;
  } else {
    sourceMatch.lockedB = false;
  }

  currentMatch[teamKey] = '';
  currentMatch[sourceKey] = null;

  clearAdvancedPath(roundIndex, matchIndex, slot);

  renderBracket(currentBracket);
  saveCurrentBracketProgress();
}

function clearAdvancedPath(roundIndex, matchIndex, slot) {
  const nextRoundIndex = roundIndex + 1;

  if (nextRoundIndex >= currentBracket.length) return;

  const nextMatchIndex = Math.floor(matchIndex / 2);
  const nextSlot = matchIndex % 2 === 0 ? 'A' : 'B';

  const nextMatch = currentBracket[nextRoundIndex][nextMatchIndex];
  const teamKey = nextSlot === 'A' ? 'teamA' : 'teamB';
  const sourceKey = nextSlot === 'A' ? 'sourceA' : 'sourceB';

  const source = nextMatch[sourceKey];

  if (
    source &&
    source.roundIndex === roundIndex &&
    source.matchIndex === matchIndex &&
    source.slot === slot
  ) {
    nextMatch[teamKey] = '';
    nextMatch[sourceKey] = null;

    clearAdvancedPath(nextRoundIndex, nextMatchIndex, nextSlot);
  }
}

async function saveCurrentBracketProgress() {
  if (!openedSavedTournamentId || !currentBracket) return;

  const userId = localStorage.getItem('user_id');

  if (!userId) return;

  await fetch(
    `https://lolstats-production-a058.up.railway.app/api/tournaments/${openedSavedTournamentId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        bracket: currentBracket
      })
    }
  );
}

loadSavedTournaments();