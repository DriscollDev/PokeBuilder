console.log("update.js loaded successfully!");
// Type Charts


// Complete Defensive Type Chart 
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


// Main functions for stab and weakness

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

function calculateSTAB(types) {
  let stabMatchups = { "2x": [], "0.5x": [], "0x": [] };
  types.forEach(type => {
    if (offensiveChart[type]) {
      Object.entries(offensiveChart[type]).forEach(([multiplier, typeList]) => {
        stabMatchups[multiplier] = [...new Set([...stabMatchups[multiplier], ...typeList])];
      });
    }
  });
  return stabMatchups;
}

function populateMatchups(containerId, matchups) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  Object.entries(matchups).forEach(([multiplier, types]) => {
    if (types.length > 0) {
      const line = document.createElement("p");
      line.innerHTML = `<strong>${multiplier}:</strong> ${types.join(", ")}`;
      container.appendChild(line);
    }
  });
}

// Renders moves and stats

function populateStats(stats) {
    const statsContainer = document.getElementById("stats");
    statsContainer.innerHTML = "";
  
    // Defines and orders the stats
    const statOrder = [
      { key: "hp", label: "HP" },
      { key: "attack", label: "Attack" },
      { key: "defense", label: "Defense" },
      { key: "special_attack", label: "Sp. Atk" },
      { key: "special_defense", label: "Sp. Def" },
      { key: "speed", label: "Speed" }
    ];
  
    statOrder.forEach(stat => {
      // 1) Get the base, IV, and EV
      const baseVal = garchomp.stats[stat.key] || 0;
      const ivVal = (garchomp.ivs[stat.key] !== undefined) ? garchomp.ivs[stat.key] : 0;
      const evVal = (garchomp.evs[stat.key] !== undefined) ? garchomp.evs[stat.key] : 0;
  
      // 2) Calculate the final stat
      const finalVal = baseVal + ivVal + Math.floor(evVal / 4);
  
      // 3) Determine a bar color based on finalVal
      let barColor = "#FB2323";  
      if (finalVal >= 40)  barColor = "#F4902C";
      if (finalVal >= 70)  barColor = "#D2F700";
      if (finalVal >= 100) barColor = "#4FE71D";
      if (finalVal >= 120) barColor = "#4ECB73";
      if (finalVal >= 150) barColor = "#37D0D6";
  
      // 4) Takes the final value of a stat and divides it by a 100
      //makes sure that if the value is over 100 it doesn't go over
      const barWidth = Math.min((finalVal / 160) * 100, 100);
  
      // 5) Create a row with label, finalVal, and a colored bar
      const rowDiv = document.createElement("div");
      rowDiv.classList.add("flex", "items-center", "mb-2", "gap-3");
      rowDiv.style.width = "100%";
      rowDiv.onclick = () => openStatModal(stat.key); // So it opens the stat modal on click
  
      rowDiv.innerHTML = `
        <!-- Label (80px wide) -->
        <span class="flex-shrink-0" style="width:80px; text-align:right;">
          ${stat.label}:
        </span>
  
        <!-- Final Stat Value (40px wide) -->
        <span class="flex-shrink-0" style="width:40px;">
          ${finalVal}
        </span>
  
        <!-- Bar Container (flex-1) -->
        <div class="bg-gray-300 rounded relative h-5 flex-1">
          <div class="absolute left-0 top-0 h-5 rounded"
               style="width: ${barWidth}%; background-color: ${barColor};">
          </div>
        </div>

      `;
  
      statsContainer.appendChild(rowDiv);
    });
  }
  



function renderMoveSlots() {
  const container = document.getElementById("moveSlotsContainer");
  container.innerHTML = "";
  const MAX_SLOTS = 4;
  for (let i = 0; i < MAX_SLOTS; i++) {
    const move = garchomp.moves[i] ? (garchomp.moves[i].name || garchomp.moves[i]) : "Empty Slot";
    const slotDiv = document.createElement("div");
    slotDiv.className = "move-slot";
    slotDiv.id = `moveSlot${i + 1}`;
    slotDiv.textContent = move;
    slotDiv.onclick = () => openMoveModal(i);
    container.appendChild(slotDiv);
  }
}


// Modal Functions for Moves

let currentMoveIndex = null;
function openMoveModal(index) {
  currentMoveIndex = index;
  const backdrop = document.getElementById("moveModalBackdrop");
  if (backdrop) backdrop.style.display = "flex";
  renderMoveList();
}
function closeMoveModal() {
  const backdrop = document.getElementById("moveModalBackdrop");
  if (backdrop) backdrop.style.display = "none";
  currentMoveIndex = null;
}

//
function renderMoveList() {
  const moveListEl = document.getElementById("moveList");
  if (!moveListEl) return;
  moveListEl.innerHTML = "";
  // Render each possible move 
  garchomp.allPossibleMoves.forEach(move => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${move.name}</span> - <span class=" text-gray-600">${move.learnedBy}</span>`;
    li.onclick = () => selectMove(move);
    moveListEl.appendChild(li);
  });
}
function selectMove(moveObj) {
  if (currentMoveIndex === null) return;
  garchomp.moves[currentMoveIndex] = moveObj;
  renderMoveSlots();
  closeMoveModal();
}

// Modal Functions for Stats

let currentStatKey = null;
function openStatModal(statKey) {
  currentStatKey = statKey;
  const backdrop = document.getElementById("statModalBackdrop");
  if (backdrop) backdrop.style.display = "flex";
  const baseVal = garchomp.stats[statKey] || 0;
  document.getElementById("baseValueDisplay").textContent = baseVal;
  document.getElementById("ivInput").value = (garchomp.ivs[statKey] !== undefined) ? garchomp.ivs[statKey] : 0;
  document.getElementById("evRange").value = (garchomp.evs[statKey] !== undefined) ? garchomp.evs[statKey] : 0;
  document.getElementById("evValueDisplay").textContent = (garchomp.evs[statKey] !== undefined) ? garchomp.evs[statKey] : 0;
  recalcStat();
}
function closeStatModal() {
  const backdrop = document.getElementById("statModalBackdrop");
  if (backdrop) backdrop.style.display = "none";
  currentStatKey = null;
}
function recalcStat() {
  if (!currentStatKey) return;
  const baseVal = garchomp.stats[currentStatKey] || 0;
  const iv = parseInt(document.getElementById("ivInput").value) || 0;
  const ev = parseInt(document.getElementById("evRange").value) || 0;
  document.getElementById("evValueDisplay").textContent = ev;
  const finalVal = baseVal + iv + Math.floor(ev / 4);
  document.getElementById("finalStatDisplay").textContent = finalVal;
}
function saveStatChanges() {
  if (!currentStatKey) return;
  const iv = parseInt(document.getElementById("ivInput").value) || 0;
  const ev = parseInt(document.getElementById("evRange").value) || 0;
  garchomp.ivs[currentStatKey] = iv;
  garchomp.evs[currentStatKey] = ev;
  const newFinal = garchomp.stats[currentStatKey] + iv + Math.floor(ev / 4);
  document.getElementById(currentStatKey + "Value").textContent = newFinal;
  closeStatModal();
}


// Set pokémon data and initialize page

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

  // Render stats using base stats plus stored IV/EV values
  populateStats(pokemon.stats);

  // Calculate and populate defensive weaknesses
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

  // Render move slots (always show 4 slots)
  renderMoveSlots();
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
    attack: 130,
    defense: 95,
    special_attack: 80,
    special_defense: 85,
    speed: 102
  },
  ivs: {
    hp: 0,
    attack: 0,
    defense: 0,
    special_attack: 0,
    special_defense: 0,
    speed: 0
  },
  evs: {
    hp: 0,
    attack: 0,
    defense: 0,
    special_attack: 0,
    special_defense: 0,
    speed: 0
  },
  moves: [
    { name: "Earthquake", learnedBy: "Level Up" },
    { name: "Swords Dance", learnedBy: "Machine" },
    { name: "Sand Tomb", learnedBy: "Level Up" }
  ],
  allPossibleMoves: [
    { name: "Earthquake", learnedBy: "Level Up" },
    { name: "Swords Dance", learnedBy: "Machine" },
    { name: "Crunch", learnedBy: "Level Up" },
    { name: "Dragon Claw", learnedBy: "Machine" },
    { name: "Sand Tomb", learnedBy: "Level Up" },
    { name: "Fire Fang", learnedBy: "Egg Move" },
    { name: "Stone Edge", learnedBy: "TM" },
    { name: "Surf", learnedBy: "Level Up" },
    { name: "Flamethrower", learnedBy: "TM" }
  ]
};

window.onload = () => setPokemonData(garchomp);
