function saveTournament(tournament) {
    localStorage.setItem("padelTournament", JSON.stringify(tournament));
}

function loadTournament() {
    const data = localStorage.getItem("padelTournament");

    if (!data) {
        return null;
    }

    return JSON.parse(data);
}

function startTournament() {
    const players = [];

    for (let i = 1; i <= 7; i++) {
        const name = document.getElementById(`player${i}`).value.trim();

        if (name === "") {
            alert(`Skriv et navn på spiller ${i}`);
            return;
        }

        players.push({
            id: i,
            name: name,
            points: 0,
            doubleGames: 0,
            singleGames: 0,
            rests: 0
        });
    }

    const tournament = {
        players: players,
        currentRound: 1,
        history: [],
        currentMatches: null
    };

    saveTournament(tournament);

    alert("Turnering oprettet!");
}
