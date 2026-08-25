/* =========================================================
   PADEL AMERICANO
   ========================================================= */


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function saveTournament(tournament) {

    localStorage.setItem(
        "padelTournament",
        JSON.stringify(tournament)
    );
}


function loadTournament() {

    const data =
        localStorage.getItem(
            "padelTournament"
        );

    if (!data) {
        return null;
    }

    return JSON.parse(data);
}


/* =========================================================
   PLAYER
   ========================================================= */

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


/* =========================================================
   HELPERS
   ========================================================= */

function shuffle(array) {

    const copy = [...array];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];

    }

    return copy;

}


function getPartnerCount(
    player,
    id
) {

    return player.partners[id] || 0;

}


function getOpponentCount(
    player,
    id
) {

    return player.opponents[id] || 0;

}


function incrementHistory(
    object,
    id
) {

    if (!object[id]) {

        object[id] = 0;

    }

    object[id]++;

}


/* =========================================================
   FIND PLAYER IN TOURNAMENT
   ========================================================= */

function getPlayerById(
    tournament,
    id
) {

    return tournament.players.find(
        player =>
            player.id === id
    );

}


/* =========================================================
   PARTNER RECENCY
   ========================================================= */

function roundsSincePartners(
    tournament,
    playerA,
    playerB
) {

    for (
        let i =
            tournament.history.length - 1;

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
            teams.some(
                team =>

                    team.includes(
                        playerA.id
                    )

                    &&

                    team.includes(
                        playerB.id
                    )
            );


        if (werePartners) {

            return (
                tournament.history.length - i
            );

        }

    }


    return 999;

}


/* =========================================================
   BALANCE SCORE
   ========================================================= */

function calculateBalanceScore(
    tournament,
    round
) {

    let score = 0;


    const totalRounds =
        tournament.history.length + 1;


    /*
       Over many rounds there should be roughly:

       4 / 7 players in double
       2 / 7 players in single
       1 / 7 player resting
    */

    const expectedDouble =
        totalRounds * 4 / 7;


    const expectedSingle =
        totalRounds * 2 / 7;


    const expectedRest =
        totalRounds * 1 / 7;


    tournament.players.forEach(
        player => {

            let doubles =
                player.doubleGames;

            let singles =
                player.singleGames;

            let rests =
                player.rests;


            if (

                round.double.team1.some(
                    p => p.id === player.id
                )

                ||

                round.double.team2.some(
                    p => p.id === player.id
                )

            ) {

                doubles++;

            }


            if (

                round.single.player1.id === player.id

                ||

                round.single.player2.id === player.id

            ) {

                singles++;

            }


            if (
                round.rest.id === player.id
            ) {

                rests++;

            }


            score +=
                Math.pow(
                    doubles - expectedDouble,
                    2
                ) * 100;


            score +=
                Math.pow(
                    singles - expectedSingle,
                    2
                ) * 100;


            score +=
                Math.pow(
                    rests - expectedRest,
                    2
                ) * 150;

        }
    );


    return score;

}


/* =========================================================
   PARTNER SCORE
   ========================================================= */

function calculatePartnerScore(
    tournament,
    round
) {

    let score = 0;


    const teams = [

        round.double.team1,

        round.double.team2

    ];


    teams.forEach(
        team => {

            const a =
                getPlayerById(
                    tournament,
                    team[0].id
                );


            const b =
                getPlayerById(
                    tournament,
                    team[1].id
                );


            if (!a || !b) {
                return;
            }


            const previous =
                getPartnerCount(
                    a,
                    b.id
                );


            /*
               Repeating an old partner is allowed,
               but should be less desirable.
            */

            score +=
                previous * 150;


            /*
               Strong penalty for using the same
               partner again very recently.
            */

            const recent =
                roundsSincePartners(
                    tournament,
                    a,
                    b
                );


            if (
                recent === 1
            ) {

                score += 5000;

            }

            else if (
                recent === 2
            ) {

                score += 1000;

            }

            else if (
                recent === 3
            ) {

                score += 300;

            }

            else if (
                recent === 4
            ) {

                score += 100;

            }

        }
    );


    return score;

}


/* =========================================================
   OPPONENT SCORE
   ========================================================= */

function calculateOpponentScore(
    tournament,
    round
) {

    let score = 0;


    round.double.team1.forEach(
        playerA => {

            round.double.team2.forEach(
                playerB => {

                    const a =
                        getPlayerById(
                            tournament,
                            playerA.id
                        );


                    const previous =
                        getOpponentCount(
                            a,
                            playerB.id
                        );


                    score +=
                        previous * 20;

                }
            );

        }
    );


    const single1 =
        getPlayerById(
            tournament,
            round.single.player1.id
        );


    score +=
        getOpponentCount(
            single1,
            round.single.player2.id
        ) * 20;


    return score;

}


/* =========================================================
   ROUND SCORE
   ========================================================= */

function scoreRound(
    tournament,
    round
) {

    return (

        calculateBalanceScore(
            tournament,
            round
        )

        +

        calculatePartnerScore(
            tournament,
            round
        )

        +

        calculateOpponentScore(
            tournament,
            round
        )

        +

        Math.random() * 5

    );

}


/* =========================================================
   GENERATE CANDIDATE
   ========================================================= */

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


/* =========================================================
   GENERATE ROUND
   ========================================================= */

function generateRound(
    tournament
) {

    let bestRound = null;

    let bestScore = Infinity;


    for (
        let i = 0;
        i < 1000;
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
            score < bestScore
        ) {

            bestScore =
                score;

            bestRound =
                candidate;

        }

    }


    return bestRound;

}


/* =========================================================
   RECORD ROUND
   ========================================================= */

function recordRound(
    tournament,
    round,
    doubleScore,
    singleScore
) {

    /*
       IMPORTANT:

       currentMatches may have been loaded from
       localStorage, meaning its player objects are
       separate objects from tournament.players.

       Therefore we ALWAYS find the real player
       using the player's ID.
    */


    const team1 =

        round.double.team1.map(
            player =>
                getPlayerById(
                    tournament,
                    player.id
                )
        );


    const team2 =

        round.double.team2.map(
            player =>
                getPlayerById(
                    tournament,
                    player.id
                )
        );


    const single1 =
        getPlayerById(
            tournament,
            round.single.player1.id
        );


    const single2 =
        getPlayerById(
            tournament,
            round.single.player2.id
        );


    const rest =
        getPlayerById(
            tournament,
            round.rest.id
        );


    /*
       SAFETY CHECK
    */

    if (

        team1.some(
            player => !player
        )

        ||

        team2.some(
            player => !player
        )

        ||

        !single1

        ||

        !single2

        ||

        !rest

    ) {

        console.error(
            "Could not find all players when recording round.",
            round
        );

        return false;

    }


    /* =====================================================
       DOUBLE POINTS
       ===================================================== */

    team1.forEach(
        player => {

            player.points +=
                doubleScore.team1;

            player.doubleGames++;

        }
    );


    team2.forEach(
        player => {

            player.points +=
                doubleScore.team2;

            player.doubleGames++;

        }
    );


    /* =====================================================
       SINGLE POINTS
       ===================================================== */

    single1.points +=
        singleScore.player1;

    single1.singleGames++;


    single2.points +=
        singleScore.player2;

    single2.singleGames++;


    /* =====================================================
       REST
       ===================================================== */

    rest.rests++;


    /* =====================================================
       PARTNERS
       ===================================================== */

    incrementHistory(
        team1[0].partners,
        team1[1].id
    );


    incrementHistory(
        team1[1].partners,
        team1[0].id
    );


    incrementHistory(
        team2[0].partners,
        team2[1].id
    );


    incrementHistory(
        team2[1].partners,
        team2[0].id
    );


    /* =====================================================
       DOUBLE OPPONENTS
       ===================================================== */

    team1.forEach(
        player1 => {

            team2.forEach(
                player2 => {

                    incrementHistory(
                        player1.opponents,
                        player2.id
                    );


                    incrementHistory(
                        player2.opponents,
                        player1.id
                    );

                }
            );

        }
    );


    /* =====================================================
       SINGLE OPPONENTS
       ===================================================== */

    incrementHistory(
        single1.opponents,
        single2.id
    );


    incrementHistory(
        single2.opponents,
        single1.id
    );


    /* =====================================================
       HISTORY
       ===================================================== */

    tournament.history.push({

        round:
            tournament.currentRound,

        double: {

            team1:
                team1.map(
                    player => player.id
                ),

            team2:
                team2.map(
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
                single1.id,

            player2:
                single2.id,

            score: {

                player1:
                    singleScore.player1,

                player2:
                    singleScore.player2

            }

        },

        rest:
            rest.id

    });


    tournament.currentRound++;


    tournament.currentMatches = null;


    saveTournament(
        tournament
    );


    return true;

}


/* =========================================================
   START TOURNAMENT
   ========================================================= */

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


        if (!name) {

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


    tournament.currentMatches =
        generateRound(
            tournament
        );


    saveTournament(
        tournament
    );


    showTournamentScreen(
        tournament
    );

}


/* =========================================================
   SHOW TOURNAMENT SCREEN
   ========================================================= */

function showTournamentScreen(
    tournament
) {

    document
        .getElementById(
            "setupScreen"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "tournamentScreen"
        )
        .classList.remove(
            "hidden"
        );


    renderRound(
        tournament
    );

}


/* =========================================================
   RENDER ROUND
   ========================================================= */

function renderRound(
    tournament
) {

    if (
        !tournament.currentMatches
    ) {

        tournament.currentMatches =
            generateRound(
                tournament
            );

        saveTournament(
            tournament
        );

    }


    const round =
        tournament.currentMatches;


    document.getElementById(
        "roundNumber"
    ).textContent =
        tournament.currentRound;


    document.getElementById(
        "doubleTeam1"
    ).textContent =

        round.double.team1
            .map(
                player =>
                    player.name
            )
            .join(" + ");


    document.getElementById(
        "doubleTeam2"
    ).textContent =

        round.double.team2
            .map(
                player =>
                    player.name
            )
            .join(" + ");


    document.getElementById(
        "singlePlayer1"
    ).textContent =
        round.single.player1.name;


    document.getElementById(
        "singlePlayer2"
    ).textContent =
        round.single.player2.name;


    document.getElementById(
        "restPlayer"
    ).textContent =
        round.rest.name;


    /*
       Clear previous scores.
    */

    document.getElementById(
        "doubleScore1"
    ).value = "";


    document.getElementById(
        "doubleScore2"
    ).value = "";


    document.getElementById(
        "singleScore1"
    ).value = "";


    document.getElementById(
        "singleScore2"
    ).value = "";


    renderLeaderboard(
        tournament
    );

}


/* =========================================================
   SUBMIT ROUND
   ========================================================= */

function submitRound() {

    const tournament =
        loadTournament();


    if (
        !tournament
    ) {

        alert(
            "Ingen aktiv turnering."
        );

        return;

    }


    const doubleScore1 =
        Number(
            document.getElementById(
                "doubleScore1"
            ).value
        );


    const doubleScore2 =
        Number(
            document.getElementById(
                "doubleScore2"
            ).value
        );


    const singleScore1 =
        Number(
            document.getElementById(
                "singleScore1"
            ).value
        );


    const singleScore2 =
        Number(
            document.getElementById(
                "singleScore2"
            ).value
        );


    /*
       CHECK THAT ALL FIELDS ARE FILLED
    */

    if (

        document.getElementById(
            "doubleScore1"
        ).value === ""

        ||

        document.getElementById(
            "doubleScore2"
        ).value === ""

        ||

        document.getElementById(
            "singleScore1"
        ).value === ""

        ||

        document.getElementById(
            "singleScore2"
        ).value === ""

    ) {

        alert(
            "Indtast resultatet for begge kampe."
        );

        return;

    }


    /*
       CHECK DOUBLE = 32
    */

    if (
        doubleScore1 +
        doubleScore2 !== 32
    ) {

        alert(
            "Double-resultatet skal give præcis 32 point i alt."
        );

        return;

    }


    /*
       CHECK SINGLE = 32
    */

    if (
        singleScore1 +
        singleScore2 !== 32
    ) {

        alert(
            "Single-resultatet skal give præcis 32 point i alt."
        );

        return;

    }


    /*
       CHECK RANGE
    */

    const scores = [

        doubleScore1,
        doubleScore2,
        singleScore1,
        singleScore2

    ];


    if (
        scores.some(
            score =>
                score < 0 ||
                score > 32
        )
    ) {

        alert(
            "Point skal være mellem 0 og 32."
        );

        return;

    }


    /*
       RECORD ROUND
    */

    const recorded =
        recordRound(

            tournament,

            tournament.currentMatches,

            {

                team1:
                    doubleScore1,

                team2:
                    doubleScore2

            },

            {

                player1:
                    singleScore1,

                player2:
                    singleScore2

            }

        );


    if (!recorded) {

        alert(
            "Der opstod en fejl, da runden skulle gemmes."
        );

        return;

    }


    /*
       GENERATE NEXT ROUND
    */

    tournament.currentMatches =
        generateRound(
            tournament
        );


    saveTournament(
        tournament
    );


    /*
       SHOW NEXT ROUND
    */

    renderRound(
        tournament
    );


    /*
       Scroll to top
    */

    window.scrollTo(
        0,
        0
    );

}


/* =========================================================
   LEADERBOARD
   ========================================================= */

function renderLeaderboard(
    tournament
) {

    const container =
        document.getElementById(
            "leaderboardList"
        );


    if (!container) {
        return;
    }


    /*
       Sort by points.

       If two players have the same
       amount of points, the player
       with fewer games gets priority.
    */

    const players =
        [...tournament.players]
            .sort(
                (a, b) => {

                    if (
                        b.points !== a.points
                    ) {

                        return (
                            b.points -
                            a.points
                        );

                    }


                    const gamesA =
                        a.doubleGames +
                        a.singleGames;


                    const gamesB =
                        b.doubleGames +
                        b.singleGames;


                    return (
                        gamesA -
                        gamesB
                    );

                }
            );


    container.innerHTML = "";


    players.forEach(
        (player, index) => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${player.name}
                </td>

                <td>
                    ${player.points}
                </td>

                <td>
                    ${player.doubleGames}
                </td>

                <td>
                    ${player.singleGames}
                </td>

                <td>
                    ${player.rests}
                </td>

            `;


            container.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   NEW TOURNAMENT
   ========================================================= */

function showSetupScreen() {

    const confirmed =
        confirm(
            "Vil du starte en ny turnering? Den nuværende turnering bliver slettet."
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        "padelTournament"
    );


    document
        .getElementById(
            "tournamentScreen"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "setupScreen"
        )
        .classList.remove(
            "hidden"
        );


    for (
        let i = 1;
        i <= 7;
        i++
    ) {

        document.getElementById(
            `player${i}`
        ).value = "";

    }

}


/* =========================================================
   SIMULATION
   ========================================================= */

function simulateTournament(
    numberOfRounds = 100
) {

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

        players,

        currentRound: 1,

        history: [],

        currentMatches: null

    };


    for (
        let i = 0;

        i < numberOfRounds;

        i++
    ) {

        const round =
            generateRound(
                simulation
            );


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


    console.log(
        `SIMULATION: ${numberOfRounds} ROUNDS`
    );


    console.table(

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
        )

    );


    const doubles =
        simulation.players.map(
            p => p.doubleGames
        );


    const singles =
        simulation.players.map(
            p => p.singleGames
        );


    const rests =
        simulation.players.map(
            p => p.rests
        );


    console.log(
        "DOUBLE difference:",

        Math.max(...doubles) -
        Math.min(...doubles)
    );


    console.log(
        "SINGLE difference:",

        Math.max(...singles) -
        Math.min(...singles)
    );


    console.log(
        "REST difference:",

        Math.max(...rests) -
        Math.min(...rests)
    );


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


    let highestPartnerCount = 0;


    simulation.players.forEach(
        player => {

            Object.values(
                player.partners
            ).forEach(
                count => {

                    highestPartnerCount =
                        Math.max(
                            highestPartnerCount,
                            count
                        );

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


/* =========================================================
   LOAD ON PAGE START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const tournament =
            loadTournament();


        if (
            tournament
        ) {

            showTournamentScreen(
                tournament
            );

        }

    }
);

// ==========================================
// FAIRNESS TEST
// ==========================================

function runFairnessTest(roundCounts = [7, 14, 21, 28], simulations = 100) {

    console.log("");
    console.log("==========================================");
    console.log("FAIRNESS TEST");
    console.log("==========================================");
    console.log(
        `Running ${simulations} simulations for each round count`
    );
    console.log("");


    const playerNames = [
        "Anton",
        "Næs",
        "Hans",
        "Gam",
        "Legind",
        "Mølle",
        "Krelle"
    ];


    roundCounts.forEach(roundCount => {

        let worstDoubleDifference = 0;
        let worstSingleDifference = 0;
        let worstRestDifference = 0;
        let worstPartnerDifference = 0;

        let worstPartnerRepetition = 0;


        for (
            let simulation = 0;
            simulation < simulations;
            simulation++
        ) {

            // ------------------------------------------
            // Create completely fresh players
            // ------------------------------------------

            const players =
                playerNames.map(
                    (name, index) =>
                        createPlayer(
                            index + 1,
                            name
                        )
                );


            const tournament = {

                players: players,

                currentRound: 1,

                history: [],

                currentMatches: null

            };


            // ------------------------------------------
            // Generate and record rounds
            // ------------------------------------------

            for (
                let round = 1;
                round <= roundCount;
                round++
            ) {

                const match =
                    generateRound(
                        tournament
                    );


                /*
                   We don't need real scores here.

                   We only care about whether the
                   scheduling algorithm distributes
                   players fairly.
                */

                const doublePlayers = [

                    ...match.double.team1,

                    ...match.double.team2

                ];


                const singlePlayers = [

                    match.single.player1,

                    match.single.player2

                ];


                const restPlayer =
                    match.rest;


                // --------------------------------------
                // Update participation statistics
                // --------------------------------------

                doublePlayers.forEach(
                    player => {

                        player.doubleGames++;

                    }
                );


                singlePlayers.forEach(
                    player => {

                        player.singleGames++;

                    }
                );


                restPlayer.rests++;


                // --------------------------------------
                // Track partners
                // --------------------------------------

                const team1 =
                    match.double.team1;

                const team2 =
                    match.double.team2;


                addPartnerRelation(
                    team1[0],
                    team1[1]
                );


                addPartnerRelation(
                    team2[0],
                    team2[1]
                );


                // --------------------------------------
                // Track opponents
                // --------------------------------------

                addOpponentRelation(
                    team1[0],
                    team2[0]
                );

                addOpponentRelation(
                    team1[0],
                    team2[1]
                );

                addOpponentRelation(
                    team1[1],
                    team2[0]
                );

                addOpponentRelation(
                    team1[1],
                    team2[1]
                );

            }


            // ==========================================
            // Analyse this simulation
            // ==========================================

            const doubleCounts =
                players.map(
                    player =>
                        player.doubleGames
                );


            const singleCounts =
                players.map(
                    player =>
                        player.singleGames
                );


            const restCounts =
                players.map(
                    player =>
                        player.rests
                );


            const doubleDifference =
                Math.max(
                    ...doubleCounts
                ) -
                Math.min(
                    ...doubleCounts
                );


            const singleDifference =
                Math.max(
                    ...singleCounts
                ) -
                Math.min(
                    ...singleCounts
                );


            const restDifference =
                Math.max(
                    ...restCounts
                ) -
                Math.min(
                    ...restCounts
                );


            // ------------------------------------------
            // Partner statistics
            // ------------------------------------------

            const partnerCounts = [];


            players.forEach(
                player => {

                    Object.values(
                        player.partners
                    ).forEach(
                        count => {

                            partnerCounts.push(
                                count
                            );

                        }
                    );

                }
            );


            const partnerDifference =
                partnerCounts.length > 0
                    ? Math.max(
                        ...partnerCounts
                    ) -
                    Math.min(
                        ...partnerCounts
                    )
                    : 0;


            const highestPartnerRepetition =
                partnerCounts.length > 0
                    ? Math.max(
                        ...partnerCounts
                    )
                    : 0;


            // ------------------------------------------
            // Store worst results
            // ------------------------------------------

            worstDoubleDifference =
                Math.max(
                    worstDoubleDifference,
                    doubleDifference
                );


            worstSingleDifference =
                Math.max(
                    worstSingleDifference,
                    singleDifference
                );


            worstRestDifference =
                Math.max(
                    worstRestDifference,
                    restDifference
                );


            worstPartnerDifference =
                Math.max(
                    worstPartnerDifference,
                    partnerDifference
                );


            worstPartnerRepetition =
                Math.max(
                    worstPartnerRepetition,
                    highestPartnerRepetition
                );

        }


        // ==============================================
        // Print result
        // ==============================================

        console.log(
            `========== ${roundCount} ROUNDS ==========`
        );


        console.log(
            "Double difference:",
            worstDoubleDifference
        );


        console.log(
            "Single difference:",
            worstSingleDifference
        );


        console.log(
            "Rest difference:",
            worstRestDifference
        );


        console.log(
            "Partner difference:",
            worstPartnerDifference
        );


        console.log(
            "Highest partner repetition:",
            worstPartnerRepetition
        );


        console.log("");

    });


    console.log(
        "=========================================="
    );

    console.log(
        "FAIRNESS TEST COMPLETE"
    );

    console.log(
        "=========================================="
    );

}


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function addPartnerRelation(
    playerA,
    playerB
) {

    if (!playerA.partners) {
        playerA.partners = {};
    }


    if (!playerB.partners) {
        playerB.partners = {};
    }


    playerA.partners[playerB.id] =
        (
            playerA.partners[playerB.id] || 0
        ) + 1;


    playerB.partners[playerA.id] =
        (
            playerB.partners[playerA.id] || 0
        ) + 1;

}


function addOpponentRelation(
    playerA,
    playerB
) {

    if (!playerA.opponents) {
        playerA.opponents = {};
    }


    if (!playerB.opponents) {
        playerB.opponents = {};
    }


    playerA.opponents[playerB.id] =
        (
            playerA.opponents[playerB.id] || 0
        ) + 1;


    playerB.opponents[playerA.id] =
        (
            playerB.opponents[playerA.id] || 0
        ) + 1;

}
