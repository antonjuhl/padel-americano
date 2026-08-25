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


function getHistoryCount(history, playerId) {
    return history[playerId] || 0;
}


function getPartnerCount(player, otherPlayerId) {
    return getHistoryCount(player.partners, otherPlayerId);
}


function getOpponentCount(player, otherPlayerId) {
    return getHistoryCount(player.opponents, otherPlayerId);
}


function getAverageDoubleGames(tournament) {
    const total = tournament.players.reduce(
        (sum, player) => sum + player.doubleGames,
        0
    );

    return total / tournament.players.length;
}


function getAverageSingleGames(tournament) {
    const total = tournament.players.reduce(
        (sum, player) => sum + player.singleGames,
        0
    );

    return total / tournament.players.length;
}


function getAverageRests(tournament) {
    const total = tournament.players.reduce(
        (sum, player) => sum + player.rests,
        0
    );

    return total / tournament.players.length;
}


function calculateBalanceScore(tournament, round) {

    let score = 0;

    const averageDouble = getAverageDoubleGames(tournament);
    const averageSingle = getAverageSingleGames(tournament);
    const averageRests = getAverageRests(tournament);


    // --------------------------------
    // DOUBLE BALANCE
    // --------------------------------

    round.double.team1.forEach(player => {

        const difference =
            player.doubleGames - averageDouble;

        score += difference * difference * 20;
    });


    round.double.team2.forEach(player => {

        const difference =
            player.doubleGames - averageDouble;

        score += difference * difference * 20;
    });


    // --------------------------------
    // SINGLE BALANCE
    // --------------------------------

    round.single.player1;
    round.single.player2;

    const singlePlayers = [
        round.single.player1,
        round.single.player2
    ];

    singlePlayers.forEach(player => {

        const difference =
            player.singleGames - averageSingle;

        score += difference * difference * 30;
    });


    // --------------------------------
    // REST BALANCE
    // --------------------------------

    const restDifference =
        round.rest.rests - averageRests;

    score += restDifference * restDifference * 40;


    return score;
}


function calculatePartnerScore(round) {

    let score = 0;


    const teams = [
        round.double.team1,
        round.double.team2
    ];


    teams.forEach(team => {

        const player1 = team[0];
        const player2 = team[1];

        const previousPartners =
            getPartnerCount(player1, player2.id);

        score += previousPartners * 100;

    });


    return score;
}


function calculateOpponentScore(round) {

    let score = 0;


    // Double vs double

    round.double.team1.forEach(player1 => {

        round.double.team2.forEach(player2 => {

            score +=
                getOpponentCount(player1, player2.id) * 20;

        });

    });


    // Single vs single

    score +=
        getOpponentCount(
            round.single.player1,
            round.single.player2.id
        ) * 20;


    return score;
}


function calculateRepeatPenalty(tournament, round) {

    let score = 0;

    const lastRound =
        tournament.history[tournament.history.length - 1];


    if (!lastRound) {
        return 0;
    }


    // --------------------------------
    // SAME PARTNER AS LAST ROUND
    // --------------------------------

    const teams = [
        round.double.team1,
        round.double.team2
    ];


    teams.forEach(team => {

        const player1 = team[0];
        const player2 = team[1];


        const previousTeam1 =
            lastRound.double.team1;

        const previousTeam2 =
            lastRound.double.team2;


        const sameTeam1 =
            previousTeam1.includes(player1.id) &&
            previousTeam1.includes(player2.id);


        const sameTeam2 =
            previousTeam2.includes(player1.id) &&
            previousTeam2.includes(player2.id);


        if (sameTeam1 || sameTeam2) {
            score += 1000;
        }

    });


    return score;
}


function calculateRandomness() {

    // Lille tilfældighed så to opstillinger med
    // næsten samme fairness ikke altid bliver ens.

    return Math.random() * 10;
}


function scoreRound(tournament, round) {

    let score = 0;


    score += calculateBalanceScore(
        tournament,
        round
    );


    score += calculatePartnerScore(
        round
    );


    score += calculateOpponentScore(
        round
    );


    score += calculateRepeatPenalty(
        tournament,
        round
    );


    score += calculateRandomness();


    return score;
}


function generateCandidateRound(tournament) {

    const shuffledPlayers =
        shuffle(tournament.players);


    return {

        double: {

            team1: [
                shuffledPlayers[0],
                shuffledPlayers[1]
            ],

            team2: [
                shuffledPlayers[2],
                shuffledPlayers[3]
            ]

        },


        single: {

            player1:
                shuffledPlayers[4],

            player2:
                shuffledPlayers[5]

        },


        rest:
            shuffledPlayers[6]

    };
}


function generateRound(tournament) {

    let bestRound = null;
    let bestScore = Infinity;


    // Vi prøver mange forskellige opstillinger
    // og vælger den mest fair.

    const attempts = 1000;


    for (let i = 0; i < attempts; i++) {

        const candidate =
            generateCandidateRound(tournament);


        const score =
            scoreRound(
                tournament,
                candidate
            );


        if (score < bestScore) {

            bestScore = score;

            bestRound = candidate;

        }

    }


    console.log(
        "Valgt runde:",
        bestRound
    );

    console.log(
        "Fairness score:",
        bestScore
    );


    return bestRound;
}


function incrementHistory(object, playerId) {

    if (!object[playerId]) {
        object[playerId] = 0;
    }

    object[playerId]++;
}


function recordRound(
    tournament,
    round,
    doubleScore,
    singleScore
) {

    const doubleTeam1 =
        round.double.team1;

    const doubleTeam2 =
        round.double.team2;

    const singlePlayer1 =
        round.single.player1;

    const singlePlayer2 =
        round.single.player2;

    const restPlayer =
        round.rest;


    // --------------------------------
    // SCORE + ANTAL KAMPE
    // --------------------------------

    doubleTeam1.forEach(player => {

        player.points +=
            doubleScore.team1;

        player.doubleGames++;

    });


    doubleTeam2.forEach(player => {

        player.points +=
            doubleScore.team2;

        player.doubleGames++;

    });


    singlePlayer1.points +=
        singleScore.player1;

    singlePlayer1.singleGames++;


    singlePlayer2.points +=
        singleScore.player2;

    singlePlayer2.singleGames++;


    restPlayer.rests++;


    // --------------------------------
    // MAKKERE
    // --------------------------------

    const team1Player1 =
        doubleTeam1[0];

    const team1Player2 =
        doubleTeam1[1];


    incrementHistory(
        team1Player1.partners,
        team1Player2.id
    );


    incrementHistory(
        team1Player2.partners,
        team1Player1.id
    );


    const team2Player1 =
        doubleTeam2[0];

    const team2Player2 =
        doubleTeam2[1];


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

        round:
            tournament.currentRound,


        double: {

            team1:
                doubleTeam1.map(
                    player => player.id
                ),

            team2:
                doubleTeam2.map(
                    player => player.id
                ),

            score: {

                team1:
                    doubleScore.team1,

                team2:
                    doubleScore.team2

            }

        },


        single: {

            player1:
                singlePlayer1.id,

            player2:
                singlePlayer2.id,

            score: {

                player1:
                    singleScore.player1,

                player2:
                    singleScore.player2

            }

        },


        rest:
            restPlayer.id

    });


    tournament.currentRound++;


    tournament.currentMatches =
        null;


    saveTournament(
        tournament
    );
}


function startTournament() {

    const players = [];


    for (let i = 1; i <= 7; i++) {

        const input =
            document.getElementById(
                `player${i}`
            );


        const name =
            input.value.trim();


        if (name === "") {

            alert(
                `Skriv et navn på spiller ${i}`
            );

            return;
        }


        players.push(
            createPlayer(
                i,
                name
            )
        );

    }


    const tournament = {

        players:
            players,

        currentRound:
            1,

        history:
            [],

        currentMatches:
            null

    };


    saveTournament(
        tournament
    );


    console.log(
        "Turnering gemt:",
        tournament
    );


    alert(
        "Turnering oprettet!"
    );
}
