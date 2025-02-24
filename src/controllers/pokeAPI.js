import Pokedex from 'pokedex-promise-v2';
import pool from './db.js';
const options = {
    protocol: 'https',
    versionPath: '/api/v2/',
    cacheLimit: 100 * 1000, // 100s
    timeout: 5 * 1000 // 5s
  }
const P = new Pokedex(options);

const pokeAPI = {
    
    getFormattedPokemonByName: async (req, res, next) =>{
        try{
            const speciesResponse = await P.getPokemonSpeciesByName(req.params.name);
            const pokeResponse = await P.getPokemonByName(req.params.name);

            const formattedResponse = {
                id: pokeResponse.id,
                name: pokeResponse.name,
                types: pokeResponse.types.map(type => type.type.name),
                abilities: pokeResponse.abilities.map(ability => ability.ability.name),
                dex_number: speciesResponse.pokedex_numbers[0].entry_number, //National dex num (need to get from specific dex which will be a filter)
                sprite_url: pokeResponse.sprites.front_default
            };
            console.log("Sending Pokemon");
            res.json(formattedResponse);


        }
        catch (error) {
            console.error('Pokemon Fetch Error :', error);
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
                        console.error(`Error fetching details for ${pokemon.name}:`, error);
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
            console.error('Generation test error:', error);
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
            console.error('Database query error:', error);
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
                    console.error(`Error fetching data for ${entry.pokemon_species.name}:`, error.message);
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
                                console.error(`Failed to fetch variety ${variety.pokemon.name}:`, varietyError.message);
                                console.error(`Variety URL: https://pokeapi.co/api/v2/pokemon/${variety.pokemon.name}`);
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
                        console.error(`Error fetching details for ${pokemon.name}:`, error.message);
                        console.error(`Species URL: ${speciesUrl}`);
                        console.error(`Varieties attempted: ${speciesData?.varieties.map(v => v.pokemon.name).join(', ')}`);
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
            console.error('Generation fetch error:', error);
            throw error;
        }
    }
}

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


export default pokeAPI;
