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


function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}


function generateRound(tournament) {
    const players = tournament.players;

    const shuffledPlayers = shuffle(players);

    const restPlayer = shuffledPlayers[0];

    const singlePlayers = [
        shuffledPlayers[1],
        shuffledPlayers[2]
    ];

    const doublePlayers = [
        shuffledPlayers[3],
        shuffledPlayers[4],
        shuffledPlayers[5],
        shuffledPlayers[6]
    ];

    return {
        double: {
            team1: [
                doublePlayers[0],
                doublePlayers[1]
            ],
            team2: [
                doublePlayers[2],
                doublePlayers[3]
            ]
        },

        single: {
            player1: singlePlayers[0],
            player2: singlePlayers[1]
        },

        rest: restPlayer
    };
}


function createPlayer(id, name) {
    return {
        id: id,
        name: name,
        points: 0,
        doubleGames: 0,
        singleGames: 0,
        rests: 0,
        partners: {},
        opponents: {}
    };
}


function startTournament() {
    const players = [];

    for (let i = 1; i <= 7; i++) {
        const name = document.getElementById(`player${i}`).value.trim();

        if (name === "") {
            alert(`Skriv et navn på spiller ${i}`);
            return;
        }

        players.push(createPlayer(i, name));
    }

    const tournament = {
        players: players,
        currentRound: 1,
        history: [],
        currentMatches: null
    };

    saveTournament(tournament);

    console.log("Turnering gemt:", tournament);

    alert("Turnering oprettet!");
}


const tournament = loadTournament();

if (tournament) {
    console.log("Nuværende turnering:", tournament);
}
