import Pokedex from 'pokedex-promise-v2';
import pool from './db.js';
const options = {
    protocol: 'https',
    versionPath: '/api/v2/',
    cacheLimit: 1000 * 1000, // 1000s
    timeout: 15 * 1000 // 10s
  }
const P = new Pokedex(options);

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}


const pokeAPI = {


    getTypeMatchups: async (type1, type2, generation) => {
        const conn = await pool.getConnection();
        const attackStatements = [`attack_type.typeName = "${type1}"`];
        const defendStatements = [`defend_type.typeName = "${type1}"`];
        
        if (type2) {
            attackStatements.push(`attack_type.typeName = "${type2}"`);
            defendStatements.push(`defend_type.typeName = "${type2}"`);
        }
        const attackQuery = `
            WITH LatestTypeMatchups AS (
                SELECT 
                    tr.origin_type,
                    tr.secondary_type,
                    tr.damage_mod,
                    tr.generation,
                    ROW_NUMBER() OVER (
                        PARTITION BY tr.origin_type, tr.secondary_type 
                        ORDER BY tr.generation DESC
                    ) as rn
                FROM type_rel tr
                WHERE tr.generation <= ${generation}
            )
            SELECT 
                attack_type.typeName AS attacking_type,
                defend_type.typeName AS defending_type,
                ltm.damage_mod,
                ltm.generation
            FROM 
                LatestTypeMatchups ltm
            JOIN 
                type_ref attack_type ON ltm.origin_type = attack_type.typeID
            JOIN
                type_ref defend_type ON ltm.secondary_type = defend_type.typeID
            WHERE 
                (${attackStatements.join(` OR `)})
                AND ltm.rn = 1
            ORDER BY 
                ltm.damage_mod DESC;
        `;
        const defendQuery = `
            WITH LatestTypeMatchups AS (
                SELECT 
                    tr.origin_type,
                    tr.secondary_type,
                    tr.damage_mod,
                    tr.generation,
                    ROW_NUMBER() OVER (
                        PARTITION BY tr.origin_type, tr.secondary_type 
                        ORDER BY tr.generation DESC
                    ) as rn
                FROM type_rel tr
                WHERE tr.generation <= ${generation}
            )
            SELECT 
                attack_type.typeName AS attacking_type,
                defend_type.typeName AS defending_type,
                ltm.damage_mod,
                ltm.generation
            FROM 
                LatestTypeMatchups ltm
            JOIN 
                type_ref attack_type ON ltm.origin_type = attack_type.typeID
            JOIN
                type_ref defend_type ON ltm.secondary_type = defend_type.typeID
            WHERE 
                (${defendStatements.join(` OR `)})
                AND ltm.rn = 1
            ORDER BY 
                ltm.damage_mod DESC;
        `;
        const [attackRows] = await conn.query(attackQuery);
        const [defendRows] = await conn.query(defendQuery);
        conn.release();
        //console.log(defendRows);

        // Process offensive and defensive matchups separately
        let offensiveMatchups = [];
        let defensiveMatchups = new Map(); // Use map to track combined defensive matchups

        for(const row of attackRows){
                offensiveMatchups.push({
                    attacking_type: row.attacking_type,
                    defending_type: row.defending_type,
                    damage_mod: row.damage_mod,
                    generation: row.generation
                });
        }
        for(const row of defendRows){
            // For defensive matchups, combine the modifiers
            const currentEntry = defensiveMatchups.get(row.attacking_type);
            if(currentEntry?.damage_mod === 0) {
                // If already immune, keep as 0
                continue;
            }
            if(!currentEntry) {
                // First occurrence of this attacking type
                defensiveMatchups.set(row.attacking_type, {
                    damage_mod: row.damage_mod,
                    generation: row.generation
                });
            } else if(row.damage_mod === 0) {
                // If new immunity found, override 
                defensiveMatchups.set(row.attacking_type, {
                    damage_mod: 0,
                    generation: row.generation
                });
            } else {
                // Multiply modifiers together
                const result = currentEntry.damage_mod * row.damage_mod;
                if(result != 1){
                    defensiveMatchups.set(row.attacking_type, {
                        damage_mod: result,
                        // Take the more recent generation
                        generation: Math.max(currentEntry.generation, row.generation)
                    });
                }
            }
        }

        // Convert defensive map to array format and sort by damage mod
        const defensiveArray = Array.from(defensiveMatchups.entries())
            .map(([type, entry]) => ({
                attacking_type: type,
                damage_mod: entry.damage_mod,
                generation: entry.generation
            }))
            .sort((a, b) => b.damage_mod - a.damage_mod);

        // Sort offensive matchups by damage mod
        offensiveMatchups.sort((a, b) => b.damage_mod - a.damage_mod);

        return {
            offensive: offensiveMatchups,
            defensive: defensiveArray
        };
    },

    getMoveSet: async (pokemonName,generation) => {
        try{
            const versionGroups = await P.getGenerationByName(generation).then(gen => gen.version_groups.map(vg => vg.name));
            const pokeResponse = await P.getPokemonByName(pokemonName);
            
            const moves = pokeResponse.moves
                .filter(move => move.version_group_details.some(detail => versionGroups.includes(detail.version_group.name)))
                    .map(move => ({
                        name: move.move.name,
                        learned_by: move.version_group_details.find(detail => versionGroups.includes(detail.version_group.name)).move_learn_method.name,
                        level_at: move.version_group_details.find(detail => versionGroups.includes(detail.version_group.name)).level_learned_at
                    }));
            return moves;
    
        }
        catch(error){
            console.log('Pokemon Fetch Error :', error);
            return null;
        }
    },
    getFullPokemonByName: async (pokemonName,generation) =>{
        try{
            //const speciesResponse = await P.getPokemonSpeciesByName(pokemonName);
            const versionGroups = await P.getGenerationByName(generation).then(gen => gen.version_groups.map(vg => vg.name));
            const pokeResponse = await P.getPokemonByName(pokemonName);
            let pastGen = 0;
            if(pokeResponse.past_types[0]){
                pastGen = parseInt(pokeResponse.past_types[0].generation.url.split('/').slice(-2)[0]);
            }
            //console.log(`Past Gen: ${pastGen} \n Generation: ${generation}`);
            const pokemonData = {
                id: pokeResponse.id,
                name: pokeResponse.name.toUpperCase(),
                height: `${pokeResponse.height / 10} m`,
                weight: `${pokeResponse.weight / 10} kg`,
                abilities: pokeResponse.abilities.map(a => a.ability.name),
                types: pokeResponse.past_types?.find(pt => {
                    return parseInt(generation) <= pastGen;
                })?.types.map(type => type.type.name) 
                    ?? pokeResponse.types.map(type => type.type.name),
                sprite_url: pokeResponse.sprites.front_default,
                statNames: {
                    hp: "HP",
                    attack: "Attack",
                    defense: "Defence",
                    special_attack: "Sp. Atk",
                    special_defense: "Sp. Def",
                    speed: "Speed"
                },
                stats: {
                    hp: pokeResponse.stats.find(s => s.stat.name === "hp").base_stat,
                    attack: pokeResponse.stats.find(s => s.stat.name === "attack").base_stat,
                    defense: pokeResponse.stats.find(s => s.stat.name === "defense").base_stat,
                    special_attack: pokeResponse.stats.find(s => s.stat.name === "special-attack").base_stat,
                    special_defense: pokeResponse.stats.find(s => s.stat.name === "special-defense").base_stat,
                    speed: pokeResponse.stats.find(s => s.stat.name === "speed").base_stat
                },
                moves: pokeResponse.moves
                    .filter(move => move.version_group_details.some(detail => versionGroups.includes(detail.version_group.name)))
                    .map(move => ({
                        name: move.move.name,
                        learned_by: move.version_group_details.find(detail => versionGroups.includes(detail.version_group.name)).move_learn_method.name,
                        level_at: move.version_group_details.find(detail => versionGroups.includes(detail.version_group.name)).level_learned_at
                    })),
            };
            //console.log(versionGroups);
            //console.log(pokemonData.moves);
            return pokemonData;
    
        }
        catch(error){
            console.log('Pokemon Fetch Error :', error);
            return null;
        }
    },

    getFormattedPokemonByName: async (req, res, next) =>{
        try{
            const speciesResponse = await P.getPokemonSpeciesByName(req.params.name);
            const pokeResponse = await P.getPokemonByName(req.params.name);
            const generation = req.params.generation || "6";
            const formattedResponse = {
                id: pokeResponse.id,
                name: pokeResponse.name,
                
                types: pokeResponse.past_types?.find(pt => {
                    const pastGen = parseInt(pt.generation.url.split('/').slice(-2)[0]);
                    return parseInt(generation) <= pastGen;
                })?.types.map(type => type.type.name) 
                    ?? pokeResponse.types.map(type => type.type.name),
                abilities: pokeResponse.abilities.map(ability => ability.ability.name),
                dex_number: speciesResponse.pokedex_numbers[0].entry_number,
                sprite_url: pokeResponse.sprites.front_default,
                stats: pokeResponse.stats.map(stat => ({ 
                    name: stat.stat.name,
                    base_stat: stat.base_stat
                }))
            };
            //console.log("Sending Pokemon");
            res.json(formattedResponse);


        }
        catch (error) {
            console.log('Pokemon Fetch Error :', error);
            next(error);
        }
        
        
    },


    getPokemon: async (req, res, next) => {
        const pokemon = await P.getPokemonByName(req.params.name);
        res.json(pokemon);
    },

    testGeneration: async (req, res, next) => {
        try {
            const response = await P.getGenerationByName("generation-i");
            
            // Get additional data for each Pokemon
            const pokemonDetails = await Promise.all(
                response.pokemon_species.map(async (pokemon) => {
                    try {
                        const pokemonData = await P.getPokemonByName(pokemon.name);
                        return {
                            id: pokemonData.id,
                            name: pokemon.name,
                            types: pokemonData.types.map(type => type.type.name),
                            dex_number: pokemonData.id,
                            sprite_url: pokemonData.sprites.front_default
                        };
                    } catch (error) {
                        console.log(`Error fetching details for ${pokemon.name}:`, error);
                        return null;
                    }
                })
            );

            // Filter out any failed requests and sort by dex number
            const formattedResponse = {
                id: response.id,
                name: response.name,
                pokemon: pokemonDetails
                    .filter(p => p !== null)
                    .sort((a, b) => a.dex_number - b.dex_number)
            };

            res.json(formattedResponse);
        } catch (error) {
            console.log('Generation test error:', error);
            next(error);
        }
    },

    getPokemonFromDB: async (req, res, next) => {
        try {
            const [rows] = await pool.query('SELECT * FROM pokemon WHERE name = ?', [req.params.name]);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Pokemon not found' });
            }
            res.json(rows[0]);
        } catch (error) {
            console.log('Database query error:', error);
            next(error);
        }
    },

    getAllPokemon: async (req, res, next) => {
        try {
            const response = await P.getPokedexByName('national');
            
            const pokemonPromises = response.pokemon_entries.map(async (entry) => {
                try {
                    const [speciesData, pokemonData] = await Promise.all([
                        P.getPokemonSpeciesByName(entry.pokemon_species.name),
                        P.getPokemonByName(entry.pokemon_species.name)
                    ]);

                    return {
                        id: pokemonData.id,
                        name: entry.pokemon_species.name,
                        types: pokemonData.types.map(type => type.type.name),
                        dex_number: entry.entry_number,
                        sprite_url: pokemonData.sprites.front_default,
                        species_name: speciesData.name,
                    };
                } catch (error) {
                    console.log(`Error fetching data for ${entry.pokemon_species.name}:`, error.message);
                    return null;
                }
            });

            const pokemonDetails = await Promise.all(pokemonPromises);
            const formattedResponse = {
                pokemon: pokemonDetails
                    .filter(p => p !== null)
                    .sort((a, b) => a.dex_number - b.dex_number)
            };

            res.json(formattedResponse);
        } catch (error) {
            next(error);
        }
    },

    getGenerations: async (generations) => {
        try {
            const generationPromises = generations.map(async (genName) => {
                const genData = await P.getGenerationByName(genName);
                
                const pokemonPromises = genData.pokemon_species.map(async (pokemon) => {
                    try {
                        // First get species data to get all varieties
                        const speciesData = await P.getPokemonSpeciesByName(pokemon.name);
                        
                        // Try each variety until we get valid Pokemon data
                        let varietyData = null;
                        for (const variety of speciesData.varieties) {
                            try {
                                varietyData = await P.getPokemonByName(variety.pokemon.name);
                                if (varietyData && varietyData.game_indices.length > 0) {
                                    break; // Found valid Pokemon data
                                }
                            } catch (varietyError) {
                                console.log(`Failed to fetch variety ${variety.pokemon.name}:`, varietyError.message);
                                console.log(`Variety URL: https://pokeapi.co/api/v2/pokemon/${variety.pokemon.name}`);
                            }
                        }

                        if (!varietyData) {
                            throw new Error('No valid varieties found');
                        }

                        // Get all game indices for this Pokemon
                        const gameIndices = varietyData.game_indices.map(index => ({
                            version: index.version.name,
                            game_index: index.game_index
                        }));

                        return {
                            id: varietyData.id,
                            name: pokemon.name,
                            types: varietyData.types.map(type => type.type.name),
                            dex_number: speciesData.pokedex_numbers.find(dex => dex.pokedex.name === 'national')?.entry_number || varietyData.id,
                            sprite_url: varietyData.sprites.front_default,
                            generation: genName,
                            species_name: speciesData.name,
                            game_indices: gameIndices
                        };
                    } catch (error) {
                        const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${pokemon.name}`;
                        console.log(`Error fetching details for ${pokemon.name}:`, error.message);
                        console.log(`Species URL: ${speciesUrl}`);
                        console.log(`Varieties attempted: ${speciesData?.varieties.map(v => v.pokemon.name).join(', ')}`);
                        return null;
                    }
                });

                const pokemonData = await Promise.all(pokemonPromises);
                return pokemonData.filter(p => p !== null);
            });

            const allGenerationsData = await Promise.all(generationPromises);
            const allPokemon = allGenerationsData
                .flat()
                .sort((a, b) => a.dex_number - b.dex_number);

            return {
                pokemon: allPokemon
            };
        } catch (error) {
            console.log('Generation fetch error:', error);
            throw error;
        }
    },

    populateGridMon: async (req) => {
        let missedMons = 0;
        let addedMons = 0;
        try {
            const nationalDex = await P.getPokedexByName('national');
            const allResponses = [];
            console.log("Starting Pokemon population");
            for (const entry of nationalDex.pokemon_entries) {
                if((addedMons + missedMons)%100 == 0){
                    console.log("==================")
                    console.log("Missed Pokemon: ", missedMons)
                    console.log("Added Pokemon: ", addedMons)
                }
                try {
                    const speciesData = await P.getPokemonSpeciesByName(entry.pokemon_species.name);
                    let defaultForm = "";
                    for (const element of speciesData.varieties) {
                        if(element.is_default){
                            defaultForm = element.pokemon.name;
                        }
                    }
                    const pokemonData = await P.getPokemonByName(defaultForm);

                    const testData = {
                        id: pokemonData.id,
                        name: speciesData.name,
                        sprite_url: pokemonData.sprites.front_default,
                        box_sprite: `https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen7x/regular/${speciesData.name}.png`,
                        dex_entries: speciesData.pokedex_numbers.map(dex => ({
                            entry_number: dex.entry_number,
                            dex_name: dex.pokedex.name,
                            dex_id: parseInt(dex.pokedex.url.split('/').slice(-2)[0])
                        })),
                        generation: speciesData.generation.name,
                        types: pokemonData.types.map(type => ({
                            slot: type.slot,
                            type: type.type.name
                        })),
                        past_types: pokemonData.past_types ? pokemonData.past_types.map(pastType => ({
                            generation: pastType.generation.name,
                            types: pastType.types.map(type => ({
                                slot: type.slot,
                                type: type.type.name
                            }))
                        })) : []
                    };
                    allResponses.push(testData);
                    addedMons++;
                } catch (error) {
                    console.log("==================")
                    console.log(`Error processing ${entry.pokemon_species.name}:`);
                    missedMons++;
                    continue;
                }
            }
            console.log("==================")
            console.log("Missed Pokemon: ", missedMons)
            console.log("Added Pokemon: ", addedMons)
            return allResponses;
        } catch (error) {
            console.log('Pokemon Fetch:', error);
            throw error;
        }
    },


    getextraPokemon: async (req, res, next) => {
        try {
            const pokemonName = req.params.name.toLowerCase();
            const data = await P.getPokemonByName(pokemonName);

            // Extract necessary data
            const pokemonData = {
                id: data.id,
                name: data.name.toUpperCase(),
                height: `${data.height / 10} m`,
                weight: `${data.weight / 10} kg`,
                abilities: data.abilities.map(a => a.ability.name),
                types: data.types.map(t => t.type.name),
                sprite_url: data.sprites.front_default,
                stats: {
                    hp: data.stats.find(s => s.stat.name === "hp").base_stat,
                    attack: data.stats.find(s => s.stat.name === "attack").base_stat,
                    defense: data.stats.find(s => s.stat.name === "defense").base_stat,
                    special_attack: data.stats.find(s => s.stat.name === "special-attack").base_stat,
                    special_defense: data.stats.find(s => s.stat.name === "special-defense").base_stat,
                    speed: data.stats.find(s => s.stat.name === "speed").base_stat
                },
                moves: data.moves.map(move => ({
                    name: move.move.name,
                    learned_by: move.version_group_details[0].move_learn_method.name 
                }))
            };

            res.json(pokemonData);
        } catch (error) {
            console.error('Error fetching Pokémon data', error);
             
        }
    }
}

async function testTypeMatchups(type1, type2, generation){
    const results = await pokeAPI.getTypeMatchups(type1, type2, generation);
    console.log('\nOffensive Matchups:');
    console.table(results.offensive.map(m => ({
        'Attacking Type': m.attacking_type,
        'Defending Type': m.defending_type,
        'Damage Modifier': m.damage_mod,
        'Generation': m.generation
    })));
    console.log('\nDefensive Matchups:');
    console.table(results.defensive.map(m => ({
        'Attacking Type': m.attacking_type,
        'Damage Modifier': m.damage_mod,
        'Generation': m.generation
})));
} 
//testTypeMatchups('steel',null,6);
export default pokeAPI;
