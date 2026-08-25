function startTournament() {
    const players = [];

    for (let i = 1; i <= 7; i++) {
        const name = document.getElementById(`player${i}`).value.trim();

        if (name === "") {
            alert(`Skriv et navn på spiller ${i}`);
            return;
        }

        players.push(name);
    }

    localStorage.setItem("padelPlayers", JSON.stringify(players));

    alert("Turnering oprettet!");
}
