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
RECENT PARTNER INFORMATION
==================================================
*/


function wasPartnersLastRound(tournament, playerA, playerB) {

    const lastRound =
        tournament.history[
            tournament.history.length - 1
        ];


    if (!lastRound) {
        return false;
    }


    const teams = [
        lastRound.double.team1,
        lastRound.double.team2
    ];


    return teams.some(team => {

        return (
            team.includes(playerA.id) &&
            team.includes(playerB.id)
        );

    });
}


function roundsSincePartners(
    tournament,
    playerA,
    playerB
) {

    /*
    Gå baglæns gennem historikken.

    1 = de var makkere sidste runde
    2 = de var makkere for to runder siden
    osv.

    0 = de har aldrig været makkere.
    */

    for (
        let i = tournament.history.length - 1;
        i >= 0;
        i--
    ) {

        const round =
            tournament.history[i];


        const teams = [
            round.double.team1,
            round.double.team2
        ];


        const werePartners =
            teams.some(team => {

                return (
                    team.includes(playerA.id) &&
                    team.includes(playerB.id)
                );

            });


        if (werePartners) {

            return (
                tournament.history.length - i
            );

        }

    }


    return 0;
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
    Efter N runder er det matematiske ideal:

    4/7 double
    2/7 single
    1/7 pause
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


/*
==================================================
PARTNER FAIRNESS
==================================================
*/


function calculatePartnerScore(
    tournament,
    round
) {

    let score = 0;


    const teams = [
        round.double.team1,
        round.double.team2
    ];


    teams.forEach(team => {

        const playerA = team[0];
        const playerB = team[1];


        /*
        ------------------------------------------
        1. SAMLET ANTAL GANGE
        ------------------------------------------
        */

        const previousCount =
            getPartnerCount(
                playerA,
                playerB.id
            );


        /*
        Hver tidligere gentagelse
        giver en straf.
        */

        score +=
            previousCount * 150;


        /*
        ------------------------------------------
        2. HVOR NYLIGT?
        ------------------------------------------
        */

        const roundsSince =
            roundsSincePartners(
                tournament,
                playerA,
                playerB
            );


        if (roundsSince === 1) {

            /*
            Samme makker som sidste runde.

            Meget stor straf.
            */

            score += 5000;

        } else if (roundsSince === 2) {

            /*
            De var makkere for
            to runder siden.
            */

            score += 1000;

        } else if (roundsSince === 3) {

            score += 300;

        } else if (roundsSince === 4) {

            score += 100;

        }

    });


    return score;
}


/*
==================================================
OPPONENT FAIRNESS
==================================================
*/


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


/*
==================================================
RANDOMNESS
==================================================
*/


function calculateRandomness() {

    return Math.random() * 5;

}


/*
==================================================
TOTAL ROUND SCORE
==================================================
*/


function scoreRound(
    tournament,
    round
) {

    let score = 0;


    score +=
        calculateBalanceScore(
            tournament,
            round
        );


    score +=
        calculatePartnerScore(
            tournament,
            round
        );


    score +=
        calculateOpponentScore(
            round
        );


    score +=
        calculateRandomness();


    return score;
}


/*
==================================================
GENERATE CANDIDATE
==================================================
*/


function generateCandidateRound(
    tournament
) {

    const players =
        shuffle(
            tournament.players
        );


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


/*
==================================================
GENERATE BEST ROUND
==================================================
*/


function generateRound(tournament) {

    let bestRound = null;
    let bestScore = Infinity;


    /*
    1000 kandidater er rigeligt med
    kun 7 spillere.
    */

    const attempts = 1000;


    for (
        let i = 0;
        i < attempts;
        i++
    ) {

        const candidate =
            generateCandidateRound(
                tournament
            );


        const score =
            scoreRound(
                tournament,
                candidate
            );


        if (
            score <
            bestScore
        ) {

            bestScore =
                score;


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
    DOUBLE
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
    SINGLE

    Single er også 32 point totalt.
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


    for (
        let i = 1;
        i <= 7;
        i++
    ) {

        const input =
            document.getElementById(
                `player${i}`
            );


        const name =
            input.value.trim();


        if (
            name === ""
        ) {

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


function simulateTournament(
    numberOfRounds = 100
) {

    /*
    Separat testturnering.
    Den ændrer IKKE den rigtige
    turnering.
    */


    const players = [

        createPlayer(
            1,
            "Anton"
        ),

        createPlayer(
            2,
            "Næs"
        ),

        createPlayer(
            3,
            "Hans"
        ),

        createPlayer(
            4,
            "Gam"
        ),

        createPlayer(
            5,
            "Legind"
        ),

        createPlayer(
            6,
            "Mølle"
        ),

        createPlayer(
            7,
            "Krelle"
        )

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
    Kør simulationen.
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
        Score er ligegyldig
        for matchmaking-testen.

        Begge kampe giver bare
        32 point.
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
    RESULTAT
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
    FORSKELLE
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
        Math.max(
            ...doubleValues
        ) -
        Math.min(
            ...doubleValues
        )
    );


    console.log(
        "SINGLE difference:",
        Math.max(
            ...singleValues
        ) -
        Math.min(
            ...singleValues
        )
    );


    console.log(
        "REST difference:",
        Math.max(
            ...restValues
        ) -
        Math.min(
            ...restValues
        )
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
    STØRSTE MAKKER-GENTAGELSE
    */

    let highestPartnerCount = 0;


    simulation.players.forEach(
        player => {

            Object.values(
                player.partners
            ).forEach(
                count => {

                    if (
                        count >
                        highestPartnerCount
                    ) {

                        highestPartnerCount =
                            count;

                    }

                }
            );

        }
    );


    console.log(
        "Highest partner repetition:",
        highestPartnerCount
    );


    return simulation;

}
