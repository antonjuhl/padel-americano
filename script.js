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


function incrementHistory(object, playerId) {
    if (!object[playerId]) {
        object[playerId] = 0;
    }

    object[playerId]++;
}


function recordRound(tournament, round, doubleScore, singleScore) {

    const doubleTeam1 = round.double.team1;
    const doubleTeam2 = round.double.team2;

    const singlePlayer1 = round.single.player1;
    const singlePlayer2 = round.single.player2;

    const restPlayer = round.rest;


    // --------------------------------
    // SCORE
    // --------------------------------

    doubleTeam1.forEach(player => {
        player.points += doubleScore.team1;
        player.doubleGames++;
    });

    doubleTeam2.forEach(player => {
        player.points += doubleScore.team2;
        player.doubleGames++;
    });

    singlePlayer1.points += singleScore.player1;
    singlePlayer1.singleGames++;

    singlePlayer2.points += singleScore.player2;
    singlePlayer2.singleGames++;

    restPlayer.rests++;


    // --------------------------------
    // DOUBLE MAKKERE
    // --------------------------------

    const team1Player1 = doubleTeam1[0];
    const team1Player2 = doubleTeam1[1];

    incrementHistory(
        team1Player1.partners,
        team1Player2.id
    );

    incrementHistory(
        team1Player2.partners,
        team1Player1.id
    );


    const team2Player1 = doubleTeam2[0];
    const team2Player2 = doubleTeam2[1];

    incrementHistory(
        team2Player1.partners,
        team2Player2.id
    );

    incrementHistory(
        team2Player2.partners,
        team2Player1.id
    );


    // --------------------------------
    // DOUBLE MODSTANDERE
    // --------------------------------

    doubleTeam1.forEach(player1 => {

        doubleTeam2.forEach(player2 => {

            incrementHistory(
                player1.opponents,
                player2.id
            );

            incrementHistory(
                player2.opponents,
                player1.id
            );

        });

    });


    // --------------------------------
    // SINGLE MODSTANDER
    // --------------------------------

    incrementHistory(
        singlePlayer1.opponents,
        singlePlayer2.id
    );

    incrementHistory(
        singlePlayer2.opponents,
        singlePlayer1.id
    );


    // --------------------------------
    // GEM RUNDEN
    // --------------------------------

    tournament.history.push({
        round: tournament.currentRound,

        double: {
            team1: doubleTeam1.map(player => player.id),
            team2: doubleTeam2.map(player => player.id),
            score: {
                team1: doubleScore.team1,
                team2: doubleScore.team2
            }
        },

        single: {
            player1: singlePlayer1.id,
            player2: singlePlayer2.id,
            score: {
                player1: singleScore.player1,
                player2: singleScore.player2
            }
        },

        rest: restPlayer.id
    });


    tournament.currentRound++;

    tournament.currentMatches = null;

    saveTournament(tournament);
}


function startTournament() {

    const players = [];

    for (let i = 1; i <= 7; i++) {

        const name = document
            .getElementById(`player${i}`)
            .value
            .trim();

        if (name === "") {
            alert(`Skriv et navn på spiller ${i}`);
            return;
        }

        players.push(
            createPlayer(i, name)
        );
    }


    const tournament = {

        players: players,

        currentRound: 1,

        history: [],

        currentMatches: null
    };


    saveTournament(tournament);

    console.log(
        "Turnering gemt:",
        tournament
    );

    alert("Turnering oprettet!");
}
