console.log("Styling.js loaded successfully!");
// Type Charts


// Complete chart for calculating weaknesses
const typeChart = {
  Normal: { Fighting: 2, Ghost: 0 },
  Fire: { Water: 2, Ground: 2, Rock: 2, Fire: 0.5, Grass: 0.5, Ice: 0.5, Bug: 0.5, Steel: 0.5, Fairy: 0.5 },
  Water: { Electric: 2, Grass: 2, Fire: 0.5, Water: 0.5, Ice: 0.5, Steel: 0.5 },
  Electric: { Ground: 2, Electric: 0.5, Flying: 0.5, Steel: 0.5 },
  Grass: { Fire: 2, Ice: 2, Poison: 2, Flying: 2, Bug: 2, Water: 0.5, Electric: 0.5, Grass: 0.5, Ground: 0.5 },
  Ice: { Fire: 2, Fighting: 2, Rock: 2, Steel: 2, Ice: 0.5 },
  Fighting: { Flying: 2, Psychic: 2, Fairy: 2, Bug: 0.5, Rock: 0.5, Dark: 0.5 },
  Poison: { Ground: 2, Psychic: 2, Fighting: 0.5, Poison: 0.5, Bug: 0.5, Grass: 0.5, Fairy: 0.5 },
  Ground: { Water: 2, Grass: 2, Ice: 2, Electric: 0, Poison: 0.5, Rock: 0.5 },
  Flying: { Electric: 2, Ice: 2, Rock: 2, Fighting: 0.5, Bug: 0.5, Grass: 0.5, Ground: 0 },
  Psychic: { Bug: 2, Ghost: 2, Dark: 2, Fighting: 0.5, Psychic: 0.5 },
  Bug: { Fire: 2, Flying: 2, Rock: 2, Fighting: 0.5, Ground: 0.5, Grass: 0.5 },
  Rock: { Water: 2, Grass: 2, Fighting: 2, Ground: 2, Steel: 2, Normal: 0.5, Fire: 0.5, Poison: 0.5, Flying: 0.5 },
  Ghost: { Ghost: 2, Dark: 2, Normal: 0, Fighting: 0, Poison: 0.5, Bug: 0.5 },
  Dragon: { Ice: 2, Dragon: 2, Fairy: 2, Fire: 0.5, Water: 0.5, Electric: 0.5, Grass: 0.5 },
  Dark: { Fighting: 2, Bug: 2, Fairy: 2, Ghost: 0.5, Dark: 0.5, Psychic: 0 },
  Steel: { Fire: 2, Fighting: 2, Ground: 2, Normal: 0.5, Grass: 0.5, Ice: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 0.5, Dragon: 0.5, Steel: 0.5, Fairy: 0.5, Poison: 0 },
  Fairy: { Poison: 2, Steel: 2, Fighting: 0.5, Bug: 0.5, Dark: 0.5, Dragon: 0 }
};

// Complete Offensive Chart for STAB effectiveness
const offensiveChart = {
  Normal: {
    "2x": [],
    "0.5x": ["Rock", "Steel"],
    "0x": ["Ghost"]
  },
  Fire: {
    "2x": ["Grass", "Ice", "Bug", "Steel"],
    "0.5x": ["Fire", "Water", "Rock", "Dragon"],
    "0x": []
  },
  Water: {
    "2x": ["Fire", "Ground", "Rock"],
    "0.5x": ["Water", "Grass", "Dragon"],
    "0x": []
  },
  Electric: {
    "2x": ["Water", "Flying"],
    "0.5x": ["Electric", "Grass", "Dragon"],
    "0x": ["Ground"]
  },
  Grass: {
    "2x": ["Water", "Ground", "Rock"],
    "0.5x": ["Fire", "Grass", "Poison", "Flying", "Bug", "Dragon", "Steel"],
    "0x": []
  },
  Ice: {
    "2x": ["Grass", "Ground", "Flying", "Dragon"],
    "0.5x": ["Fire", "Water", "Ice", "Steel"],
    "0x": []
  },
  Fighting: {
    "2x": ["Normal", "Rock", "Steel", "Ice", "Dark"],
    "0.5x": ["Poison", "Flying", "Psychic", "Bug", "Fairy"],
    "0x": ["Ghost"]
  },
  Poison: {
    "2x": ["Grass", "Fairy"],
    "0.5x": ["Poison", "Ground", "Rock", "Ghost"],
    "0x": ["Steel"]
  },
  Ground: {
    "2x": ["Fire", "Electric", "Poison", "Rock", "Steel"],
    "0.5x": ["Grass", "Bug"],
    "0x": ["Flying"]
  },
  Flying: {
    "2x": ["Grass", "Fighting", "Bug"],
    "0.5x": ["Electric", "Rock", "Steel"],
    "0x": []
  },
  Psychic: {
    "2x": ["Fighting", "Poison"],
    "0.5x": ["Psychic", "Steel"],
    "0x": ["Dark"]
  },
  Bug: {
    "2x": ["Grass", "Psychic", "Dark"],
    "0.5x": ["Fire", "Fighting", "Poison", "Flying", "Ghost", "Steel", "Fairy"],
    "0x": []
  },
  Rock: {
    "2x": ["Fire", "Ice", "Flying", "Bug"],
    "0.5x": ["Fighting", "Ground", "Steel"],
    "0x": []
  },
  Ghost: {
    "2x": ["Ghost", "Psychic"],
    "0.5x": ["Dark"],
    "0x": ["Normal"]
  },
  Dragon: {
    "2x": ["Dragon"],
    "0.5x": ["Steel"],
    "0x": ["Fairy"]
  },
  Dark: {
    "2x": ["Ghost", "Psychic"],
    "0.5x": ["Fighting", "Dark", "Fairy"],
    "0x": []
  },
  Steel: {
    "2x": ["Ice", "Rock", "Fairy"],
    "0.5x": ["Fire", "Water", "Electric", "Steel"],
    "0x": []
  },
  Fairy: {
    "2x": ["Fighting", "Dragon", "Dark"],
    "0.5x": ["Fire", "Poison", "Steel"],
    "0x": []
  }
};

// Functions


// Calculate Weaknesses based on defensive type chart
// Checks if a pokemon is weak to something and then if it is multiplies it otherwise just adds the multiplier
function calculateWeakness(types) {
  let weaknesses = {};
  types.forEach(type => {
    if (typeChart[type]) {
      Object.entries(typeChart[type]).forEach(([wType, multiplier]) => {
        weaknesses[wType] = weaknesses[wType] ? weaknesses[wType] * multiplier : multiplier;
      });
    }
  });
  return weaknesses;
}

// Calculate STAB effectiveness using offensive chart
function calculateSTAB(types) {
  let stabMatchups = { "2x": [], "0.5x": [], "0x": [] };
  types.forEach(type => {
    if (offensiveChart[type]) {
      Object.entries(offensiveChart[type]).forEach(([multiplier, typeList]) => {
        stabMatchups[multiplier] = [...new Set([...stabMatchups[multiplier], ...typeList])]; //Uses ... to combine two lists into one 
      });
    }
  });
  return stabMatchups;
}

// Type Colors Mapping
const typeColors = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
  steel: "#B7B7CE", fairy: "#D685AD"
};

function populateMatchups(containerId, matchups) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  container.className = "flex flex-col justify-center items-center gap-5 w-full h-full";

  Object.entries(matchups).forEach(([multiplier, types]) => {
    if (types.length > 0) {
      const row = document.createElement("div");
      row.className = "flex flex-wrap justify-center items-center gap-x-4 gap-y-3 w-full";

      // Effectiveness Multiplier Label
      const multiplierSpan = document.createElement("span");
      multiplierSpan.className = "font-bold text-xl";
      multiplierSpan.innerText = `${multiplier}`;
      row.appendChild(multiplierSpan);

      // Type Labels 
      types.forEach(type => {
        const typeBadge = document.createElement("span");
        typeBadge.className = `px-4 py-2 rounded-lg text-white text-md font-semibold shadow-md min-w-[80px] text-center`;
        typeBadge.style.backgroundColor = typeColors[type.toLowerCase()] || "#777";
        typeBadge.innerText = type;
        row.appendChild(typeBadge);
      });

      container.appendChild(row);
    }
  });
}


// Populate Base Stats (linear layout with aligned bars)
function populateStats(stats) {
  const statsContainer = document.getElementById("stats");
  statsContainer.innerHTML = "";

  Object.entries(stats).forEach(([statName, value]) => {
    let barColor = "#FB2323";  // default
    if (value >= 40) barColor = "#F4902C";
    if (value >= 70) barColor = "#D2F700";
    if (value >= 100) barColor = "#4FE71D";
    if (value >= 120) barColor = "#4ECB73";
    if (value >= 150) barColor = "#37D0D6";

    // Calculate bar width based on stat value / 160
    const barWidth = Math.min((value / 160) * 100, 100);

    // For each stat creates a row
    statsContainer.innerHTML += `
        <div class="flex items-center mb-2 gap-3" style="width: 100%;">
          <!-- Label (fixed 80px width) -->
          <span class=" flex-shrink-0" style="width:80px; text-align:right;">
            ${statName.toUpperCase()}:
          </span>
  
          <!-- Value (fixed 40px width) -->
          <span class="flex-shrink-0" style="width:40px;">
            ${value}
          </span>
  
          <!-- Bar Container (flex-1) -->
          <div class="bg-gray-300 rounded relative h-5 flex-1">
            <div class="absolute left-0 top-0 h-5 rounded" 
                 style="width: ${barWidth}%; background-color: ${barColor};">
            </div>
          </div>
        </div>
      `;
  });
}

// Generate Move Table dynamically
function generateMoveTable(moves) {
  const moveTableBody = document.getElementById("moveTableBody");
  moveTableBody.innerHTML = "";
  moves.forEach(move => {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="border px-4 py-2">${move.name}</td><td class="border px-4 py-2">${move.learnedBy}</td>`;
    moveTableBody.appendChild(row);
  });
}

// Set Pokémon Data dynamically
function setPokemonData(pokemon) {
  document.getElementById("pokemonName").innerText = pokemon.name;
  document.getElementById("pokemonImage").src = pokemon.image;
  document.getElementById("pokedexNumber").innerText = `Dex# ${pokemon.dex}`;
  const typeContainer = document.getElementById("typeContainer");
  typeContainer.innerHTML = "";
  pokemon.types.forEach(type => {
    const typeSpan = document.createElement("span");
    typeSpan.className = `pokedextype ${type.toLowerCase()}`;
    typeSpan.innerText = type;
    typeContainer.appendChild(typeSpan);
  });

  document.getElementById("abilities").innerText = `Abilities: ${pokemon.abilities.join(", ")}`;
  document.getElementById("generation").innerText = `Generation: ${pokemon.generation}`;
  document.getElementById("weight").innerText = `Weight: ${pokemon.weight} kg`;
  document.getElementById("height").innerText = `Height: ${pokemon.height} m`;

  // Populate Stats
  populateStats(pokemon.stats);

  // Calculate and populate Defensive Weaknesses
  const weaknesses = calculateWeakness(pokemon.types);
  let groupedWeaknesses = { "4x": [], "2x": [], "0.5x": [], "0x": [] };
  Object.entries(weaknesses).forEach(([type, mult]) => {
    if (mult === 4) groupedWeaknesses["4x"].push(type);
    else if (mult === 2) groupedWeaknesses["2x"].push(type);
    else if (mult === 0.5) groupedWeaknesses["0.5x"].push(type);
    else if (mult === 0) groupedWeaknesses["0x"].push(type);
  });
  populateMatchups("weaknessContainer", groupedWeaknesses);

  // Calculate and populate Offensive STAB effectiveness
  const stab = calculateSTAB(pokemon.types);
  populateMatchups("stabContainer", stab);

  // Populate Move Table
  generateMoveTable(pokemon.moves);
}

// Example Pokémon Data
const garchomp = {
  name: "Garchomp",
  image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png",
  dex: 445,
  types: ["Dragon", "Ground"],
  abilities: ["Rough Skin", "Sand Veil"],
  generation: "4",
  weight: 95.0,
  height: 1.9,
  stats: {
    hp: 108,
    atk: 130,
    def: 95,
    sp_atk: 80,
    sp_def: 85,
    speed: 102
  },
  moves: [
    { name: "Earthquake", learnedBy: "Level Up" },
    { name: "Swords Dance", learnedBy: "Machine" },
    { name: "Sand Tomb", learnedBy: "Level Up" },
    { name: "Crunch", learnedBy: "Level Up" },
    { name: "Dragon Claw", learnedBy: "Machine" },
    { name: "Fire Fang", learnedBy: "Egg Move" }
  ]
};

// On Page Load, populate Pokémon data
window.onload = () => setPokemonData(garchomp);
