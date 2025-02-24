function createStatBar(statValue) {
    const maxStat = 160;
    const percentage = (statValue / maxStat) * 100; // Scale stat to a percentage

    // Determine the color based on stat ranges
    let color = "blue";
    if (statValue <= 39) color = "red";
    else if (statValue <= 70) color = "yellow";
    else if (statValue <= 90) color = "yellowgreen";
    else if (statValue <= 119) color = "green";
    else if (statValue <= 145) color = "darkgreen";

    return `
        <div style="position: relative; width: 100%; height: 10px; background-color: #333; border-radius: 5px;">
            <div style="width: ${percentage}%; height: 100%; background-color: ${color}; border-radius: 5px;"></div>
        </div>
    `;
}

function generatePokemonStatsTable(stats) {
    return `
        <table>
            <tr><td>HP:</td><td>${stats.hp}</td><td>${createStatBar(stats.hp)}</td></tr>
            <tr><td>Attack:</td><td>${stats.attack}</td><td>${createStatBar(stats.attack)}</td></tr>
            <tr><td>Defense:</td><td>${stats.defense}</td><td>${createStatBar(stats.defense)}</td></tr>
            <tr><td>Sp. Atk:</td><td>${stats.special_attack}</td><td>${createStatBar(stats.special_attack)}</td></tr>
            <tr><td>Sp. Def:</td><td>${stats.special_defense}</td><td>${createStatBar(stats.special_defense)}</td></tr>
            <tr><td>Speed:</td><td>${stats.speed}</td><td>${createStatBar(stats.speed)}</td></tr>
        </table>
    `;
}
