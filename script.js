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


function getPartnerCount(player, otherPlayerId) {
    return player.partners[otherPlayerId] || 0;
}


function getOpponentCount(player, otherPlayerId) {
    return player.opponents[otherPlayerId] || 0;
}


function incrementHistory(object, playerId) {
    if (!object[playerId]) {
        object[playerId] = 0;
    }

    object[playerId]++;
}


/*
==================================================
FAIRNESS
==================================================
*/


function calculateBalanceScore(tournament, round) {

    let score = 0;

    const totalRounds =
        tournament.history.length;

    /*
    Efter N runder forventer vi i gennemsnit:

    Double: 4/7 af runderne
    Single:  2/7 af runderne
    Rest:    1/7 af runderne
    */

    const expectedDouble =
        (totalRounds + 1) * (4 / 7);

    const expectedSingle =
        (totalRounds + 1) * (2 / 7);

    const expectedRest =
        (totalRounds + 1) * (1 / 7);


    tournament.players.forEach(player => {

        let futureDouble =
            player.doubleGames;

        let futureSingle =
            player.singleGames;

        let futureRest =
            player.rests;


        /*
        Find ud af hvilken rolle spilleren
        får i den nye runde.
        */

        const isDouble =
            round.double.team1.includes(player) ||
            round.double.team2.includes(player);

        const isSingle =
            round.single.player1 === player ||
            round.single.player2 === player;

        const isRest =
            round.rest === player;


        if (isDouble) {
            futureDouble++;
        }

        if (isSingle) {
            futureSingle++;
        }

        if (isRest) {
            futureRest++;
        }


        /*
        Straffen bliver større jo længere
        vi kommer væk fra idealfordelingen.
        */

        const doubleDifference =
            futureDouble - expectedDouble;

        const singleDifference =
            futureSingle - expectedSingle;

        const restDifference =
            futureRest - expectedRest;


        score +=
            doubleDifference *
            doubleDifference *
            100;


        score +=
            singleDifference *
            singleDifference *
            100;


        score +=
            restDifference *
            restDifference *
            150;

    });


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
            getPartnerCount(
                player1,
                player2.id
            );


        /*
        Gentagne makkere bliver straffet.

        Første gang: 0
        Anden gang: 150
        Tredje gang: 300
        osv.
        */

        score +=
            previousPartners * 150;

    });


    return score;
}


function calculateOpponentScore(round) {

    let score = 0;


    /*
    DOUBLE MOD DOUBLE
    */

    round.double.team1.forEach(player1 => {

        round.double.team2.forEach(player2 => {

            score +=
                getOpponentCount(
                    player1,
                    player2.id
                ) * 20;

        });

    });


    /*
    SINGLE MOD SINGLE
    */

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
        tournament.history[
            tournament.history.length - 1
        ];


    if (!lastRound) {
        return 0;
    }


    /*
    SAMME MAKKER TO RUNDER I TRÆK
    */

    const currentTeams = [
        round.double.team1,
        round.double.team2
    ];


    const previousTeams = [
        lastRound.double.team1,
        lastRound.double.team2
    ];


    currentTeams.forEach(currentTeam => {

        const currentA =
            currentTeam[0].id;

        const currentB =
            currentTeam[1].id;


        previousTeams.forEach(previousTeam => {

            const samePair =
                previousTeam.includes(currentA) &&
                previousTeam.includes(currentB);


            if (samePair) {

                /*
                Meget stor straf.

                Vi vil næsten aldrig
                have dette.
                */

                score += 5000;

            }

        });

    });


    return score;
}


function calculateRandomness() {

    /*
    Lille tilfældighed.

    Det betyder, at to lige gode
    opstillinger ikke altid bliver ens.
    */

    return Math.random() * 5;
}


function scoreRound(tournament, round) {

    let score = 0;


    score +=
        calculateBalanceScore(
            tournament,
            round
        );


    score +=
        calculatePartnerScore(
            round
        );


    score +=
        calculateOpponentScore(
            round
        );


    score +=
        calculateRepeatPenalty(
            tournament,
            round
        );


    score +=
        calculateRandomness();


    return score;
}


/*
==================================================
GENERATE ROUND
==================================================
*/


function generateCandidateRound(tournament) {

    const players =
        shuffle(tournament.players);


    return {

        double: {

            team1: [
                players[0],
                players[1]
            ],

            team2: [
                players[2],
                players[3]
            ]

        },


        single: {

            player1:
                players[4],

            player2:
                players[5]

        },


        rest:
            players[6]

    };
}


function generateRound(tournament) {

    let bestRound = null;
    let bestScore = Infinity;


    /*
    Vi tester 1000 forskellige
    opstillinger.
    */

    const attempts = 1000;


    for (let i = 0; i < attempts; i++) {

        const candidate =
            generateCandidateRound(
                tournament
            );


        const score =
            scoreRound(
                tournament,
                candidate
            );


        if (score < bestScore) {

            bestScore = score;

            bestRound =
                candidate;

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


/*
==================================================
RECORD ROUND
==================================================
*/


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


    /*
    DOUBLE POINTS
    */

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


    /*
    SINGLE POINTS
    */

    singlePlayer1.points +=
        singleScore.player1;

    singlePlayer1.singleGames++;


    singlePlayer2.points +=
        singleScore.player2;

    singlePlayer2.singleGames++;


    /*
    REST
    */

    restPlayer.rests++;


    /*
    PARTNERS
    */

    incrementHistory(
        doubleTeam1[0].partners,
        doubleTeam1[1].id
    );


    incrementHistory(
        doubleTeam1[1].partners,
        doubleTeam1[0].id
    );


    incrementHistory(
        doubleTeam2[0].partners,
        doubleTeam2[1].id
    );


    incrementHistory(
        doubleTeam2[1].partners,
        doubleTeam2[0].id
    );


    /*
    DOUBLE OPPONENTS
    */

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


    /*
    SINGLE OPPONENTS
    */

    incrementHistory(
        singlePlayer1.opponents,
        singlePlayer2.id
    );


    incrementHistory(
        singlePlayer2.opponents,
        singlePlayer1.id
    );


    /*
    GEM HISTORIK
    */

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


/*
==================================================
START TOURNAMENT
==================================================
*/


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


/*
==================================================
SIMULATOR
==================================================
*/


function simulateTournament(numberOfRounds = 100) {

    /*
    Vi laver en HELT NY testturnering.

    Den påvirker IKKE din rigtige
    turnering i localStorage.
    */


    const players = [

        createPlayer(1, "Anton"),

        createPlayer(2, "Næs"),

        createPlayer(3, "Hans"),

        createPlayer(4, "Gam"),

        createPlayer(5, "Legind"),

        createPlayer(6, "Mølle"),

        createPlayer(7, "Krelle")

    ];


    const simulation = {

        players:
            players,

        currentRound:
            1,

        history:
            [],

        currentMatches:
            null

    };


    /*
    Kør det ønskede antal runder.
    */

    for (
        let i = 0;
        i < numberOfRounds;
        i++
    ) {

        const round =
            generateRound(
                simulation
            );


        /*
        Vi behøver ikke realistiske
        scores her.

        Scores er ligegyldige for
        matchmaking-testen.
        */

        recordRound(
            simulation,

            round,

            {
                team1: 16,
                team2: 16
            },

            {
                player1: 16,
                player2: 16
            }
        );

    }


    /*
    VIS RESULTAT
    */

    console.log(
        "=============================="
    );

    console.log(
        `SIMULATION: ${numberOfRounds} ROUNDS`
    );

    console.log(
        "=============================="
    );


    const results =
        simulation.players.map(
            player => ({

                name:
                    player.name,

                double:
                    player.doubleGames,

                single:
                    player.singleGames,

                rests:
                    player.rests

            })
        );


    console.table(
        results
    );


    /*
    FIND MAKS/MIN
    */

    const doubleValues =
        simulation.players.map(
            player =>
                player.doubleGames
        );


    const singleValues =
        simulation.players.map(
            player =>
                player.singleGames
        );


    const restValues =
        simulation.players.map(
            player =>
                player.rests
        );


    console.log(
        "DOUBLE difference:",
        Math.max(...doubleValues) -
        Math.min(...doubleValues)
    );


    console.log(
        "SINGLE difference:",
        Math.max(...singleValues) -
        Math.min(...singleValues)
    );


    console.log(
        "REST difference:",
        Math.max(...restValues) -
        Math.min(...restValues)
    );


    /*
    PARTNERE
    */

    console.log(
        "PARTNERS"
    );


    simulation.players.forEach(
        player => {

            console.log(
                player.name,
                player.partners
            );

        }
    );


    /*
    Find den største
    makker-gentagelse.
    */

    let highestPartnerCount = 0;


    simulation.players.forEach(
        player => {

            Object.values(
                player.partners
            ).forEach(count => {

                if (
                    count >
                    highestPartnerCount
                ) {

                    highestPartnerCount =
                        count;

                }

            });

        }
    );


    console.log(
        "Highest partner repetition:",
        highestPartnerCount
    );


    return simulation;
}
