import express from 'express';
import pokeAPI from '../controllers/pokeAPI.js';
import pool from '../controllers/db.js'; 
import teamController from '../controllers/teamController.js';

const router = express.Router();

function getAuthenticatedUserId(req) {
    return req.session?.passport?.user?.userID || null;
}

function parsePositiveInt(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseSlotNumber(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 5 ? parsed : null;
}

function isValidTypeName(value) {
    return typeof value === 'string' && /^[a-z-]+$/i.test(value);
}

function isValidMoveList(moves) {
    return Array.isArray(moves)
        && moves.length === 4
        && moves.every(move => typeof move === 'string' && move.length > 0 && move.length <= 100);
}

function isValidNumericStatValue(value, min, max) {
    return Number.isInteger(value) && value >= min && value <= max;
}

function isValidStatsPayload(stats) {
    if (!stats || typeof stats !== 'object') return false;

    const statGroups = ['evs', 'ivs', 'total'];
    const statFields = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];

    for (const group of statGroups) {
        if (!stats[group] || typeof stats[group] !== 'object') return false;
        for (const field of statFields) {
            const value = stats[group][field];
            if (!Number.isInteger(value)) return false;
        }
    }

    return isValidNumericStatValue(stats.evs.hp, 0, 252)
        && isValidNumericStatValue(stats.evs.attack, 0, 252)
        && isValidNumericStatValue(stats.evs.defense, 0, 252)
        && isValidNumericStatValue(stats.evs.specialAttack, 0, 252)
        && isValidNumericStatValue(stats.evs.specialDefense, 0, 252)
        && isValidNumericStatValue(stats.evs.speed, 0, 252)
        && isValidNumericStatValue(stats.ivs.hp, 0, 31)
        && isValidNumericStatValue(stats.ivs.attack, 0, 31)
        && isValidNumericStatValue(stats.ivs.defense, 0, 31)
        && isValidNumericStatValue(stats.ivs.specialAttack, 0, 31)
        && isValidNumericStatValue(stats.ivs.specialDefense, 0, 31)
        && isValidNumericStatValue(stats.ivs.speed, 0, 31);
}

function isValidPokemonPayload(pokemonData) {
    if (!pokemonData || typeof pokemonData !== 'object') return false;

    if (!parsePositiveInt(pokemonData.dex_number)) return false;
    if (typeof pokemonData.name !== 'string' || pokemonData.name.length === 0) return false;
    if (typeof pokemonData.sprite_url !== 'string') return false;

    if (!Array.isArray(pokemonData.types) || pokemonData.types.length < 1 || pokemonData.types.length > 2) return false;
    if (!pokemonData.types.every(isValidTypeName)) return false;

    if (!Array.isArray(pokemonData.abilities) || pokemonData.abilities.length < 1) return false;
    if (!pokemonData.abilities.every(ability => typeof ability === 'string' && ability.length > 0 && ability.length <= 100)) return false;

    if (!Array.isArray(pokemonData.stats) || pokemonData.stats.length === 0) return false;

    return true;
}

router.post('/select-slot', async (req, res) => {
    try {
        const userID = getAuthenticatedUserId(req);
        if (!userID) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const teamID = parsePositiveInt(req.body.teamID);
        const slotNumber = parseSlotNumber(req.body.slotNumber);

        if (!teamID || slotNumber === null) {
            return res.status(400).json({ success: false, error: 'Invalid team or slot' });
        }

        const conn = await pool.getConnection();
        // Get the team's generation from the database
        const [teamData] = await conn.execute(`
            SELECT generation FROM teams WHERE teamID = ? AND ownerID = ?
        `, [teamID, userID]);
        conn.release();

        if (!teamData[0]) {
            return res.status(403).json({ success: false, error: 'Team not found or not owned by user' });
        }

        // Get the generation number directly
        const generationNumber = teamData[0]?.generation || '1';

        // Store the team, slot, and generation information in the session
        req.session.selectedTeam = {
            teamID,
            slotNumber,
            generation: generationNumber
        };
        // If it's a JSON request, send JSON response
        if ((req.headers['content-type'] || '').includes('application/json')) {
            res.json({ success: true });
        } else {
            // Otherwise, redirect to the Pokédex page
            res.redirect(`/poke/dex/${generationNumber}`);
        }
    } catch (error) {
        console.log('Select slot error:', error);
        if ((req.headers['content-type'] || '').includes('application/json')) {
            res.status(500).json({ success: false, error: error.message });
        } else {
            res.status(500).send('Error selecting slot');
        }
    }
});

// Pokedex routes
router.get('/dex/:generation?', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const generation = req.params.generation || '1';
        
        // Map generation number to dex name
        const dexNames = {
            '1': 'kanto',
            '2': 'updated-johto',
            '3': 'updated-hoenn',
            '4': 'extended-sinnoh',
            '5': 'updated-unova',
            '6': 'kalos-central',
            '7': 'updated-alola',
            '8': 'galar',
            '9': 'paldea'
        };

        const dexName = dexNames[generation] || 'kanto';

        // Get user's teams if they're logged in
        let userTeams = [];
        if (req.session.passport?.user) {
            // First get the teams
            const [teams] = await conn.execute(
                'SELECT teamID, teamname, generation, pokemon1, pokemon2, pokemon3, pokemon4, pokemon5, pokemon6 FROM teams WHERE ownerID = ? ORDER BY created_at DESC',
                [req.session.passport.user.userID]
            );
            
            // For each team, get the Pokemon names
            for (const team of teams) {
                const pokemonSlots = [];
                for (let i = 1; i <= 6; i++) {
                    const pokemonId = team[`pokemon${i}`];
                    if (pokemonId) {
                        const [pokemonData] = await conn.execute(`
                            SELECT pbd.name 
                            FROM pokemon p
                            JOIN poke_base_data pbd ON p.baseDataID = pbd.baseID
                            WHERE p.pokemonID = ?
                        `, [pokemonId]);
                        pokemonSlots.push(pokemonData[0]?.name || null);
                    } else {
                        pokemonSlots.push(null);
                    }
                }
                team.pokemon = pokemonSlots;
            }
            userTeams = teams;
        }
        const [pokemon] = await conn.execute(`
            SELECT 
                dm.id,
                dm.name,
                dm.sprite_url,
                dm.generation,
                pe.entry_number as pokedex_number,
                CASE 
                    WHEN pt.generation IS NOT NULL AND ? <= pt.generation THEN pt.type1
                    ELSE pt1.type 
                END as primary_type,
                CASE 
                    WHEN pt.generation IS NOT NULL AND ? <= pt.generation THEN pt.type2
                    ELSE pt2.type 
                END as secondary_type
            FROM dex_mon dm
            JOIN pokedex_entries pe ON dm.id = pe.pokemon_id
                AND pe.dex_name = ?
            LEFT JOIN pokemon_types pt1 ON dm.id = pt1.pokemon_id 
                AND pt1.slot = 1
            LEFT JOIN pokemon_types pt2 ON dm.id = pt2.pokemon_id 
                AND pt2.slot = 2
            LEFT JOIN past_type pt ON dm.id = pt.pokemon_id
            ORDER BY pe.entry_number
        `, [generation, generation, dexName]);


        
        conn.release();
        res.render('pokedex', {
            title: `${dexName.charAt(0).toUpperCase() + dexName.slice(1)} Pokédex`,
            pokemon: pokemon,
            selectedTeam: req.session.selectedTeam || null,
            userTeams: userTeams,
            generation: generation
        });
    } catch (error) {
        console.log('Pokedex error:', error);
        res.status(500).send('Error loading Pokédex');
    }
});

router.get('/mon/:name/:generation?', pokeAPI.getFormattedPokemonByName);


router.post('/editpokemon', async(req,res) => {
    try {
        const userID = getAuthenticatedUserId(req);
        if (!userID) {
            return res.status(401).send('Authentication required');
        }

        const pokemonID = parsePositiveInt(req.body.pokemonID);
        const teamID = parsePositiveInt(req.body.teamID);

        if (!pokemonID || !teamID) {
            return res.status(400).send('Invalid team or pokemon');
        }

        const conn = await pool.getConnection();
        const [ownedTeam] = await conn.execute(
            `SELECT generation FROM teams
             WHERE teamID = ?
               AND ownerID = ?
               AND (? IN (pokemon1, pokemon2, pokemon3, pokemon4, pokemon5, pokemon6))`,
            [teamID, userID, pokemonID]
        );

        if (!ownedTeam[0]) {
            conn.release();
            return res.status(403).send('Unauthorized team or pokemon access');
        }

        const [pokemon] = await Promise.all([teamController.getPokemonData(pokemonID)]);
        conn.release();

        if (!pokemon) {
            return res.status(404).send('Pokemon not found');
        }

        const matchups = await pokeAPI.getTypeMatchups(pokemon.types[0],pokemon.types[1],pokemon.generation);
        const moveSet = await pokeAPI.getMoveSet(pokemon.name,pokemon.generation);
        res.render('editpokemon', { 
            pokemon: pokemon, 
            matchups: matchups, 
            generation: pokemon.generation,
            teamID,
            moveSet: moveSet
        });

    } catch (error) {
        console.log('Error fetching Pokémon data:', error);
    }
});

// Add route for updating Pokemon
router.post('/update-pokemon', async (req, res) => {
    try {
        const userID = getAuthenticatedUserId(req);
        if (!userID) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const conn = await pool.getConnection();
        const pokemonID = parsePositiveInt(req.body.pokemonID);
        const { moves, stats } = req.body;

        if (!pokemonID || !isValidMoveList(moves) || !isValidStatsPayload(stats)) {
            conn.release();
            return res.status(400).json({ success: false, error: 'Invalid pokemon update payload' });
        }

        // Get the current Pokemon data to get the necessary IDs
        const [pokemonData] = await conn.execute(
            `SELECT p.choiceDataID, p.moveSetID
             FROM pokemon p
             JOIN teams t ON (
                p.pokemonID = t.pokemon1 OR p.pokemonID = t.pokemon2 OR p.pokemonID = t.pokemon3
                OR p.pokemonID = t.pokemon4 OR p.pokemonID = t.pokemon5 OR p.pokemonID = t.pokemon6
             )
             WHERE p.pokemonID = ? AND t.ownerID = ?
             LIMIT 1`,
            [pokemonID, userID]
        );

        if (!pokemonData[0]) {
            throw new Error('Pokemon not found');
        }

        await conn.beginTransaction();
        try {
            // Update moves
            await conn.execute(
                'UPDATE poke_moveset SET move1 = ?, move2 = ?, move3 = ?, move4 = ? WHERE moveSetID = ?',
                [...moves, pokemonData[0].moveSetID]
            );

            // Get stat IDs
            const [choiceData] = await conn.execute(
                'SELECT statEV, statIV, statTotal FROM poke_choice_data WHERE choiceID = ?',
                [pokemonData[0].choiceDataID]
            );

            // Update EVs
            await conn.execute(
                'UPDATE stat_list SET sHealth = ?, sAtk = ?, sDef = ?, sSpAtk = ?, sSpDef = ?, sSpd = ? WHERE statID = ?',
                [stats.evs.hp, stats.evs.attack, stats.evs.defense, stats.evs.specialAttack, stats.evs.specialDefense, stats.evs.speed, choiceData[0].statEV]
            );

            // Update IVs
            await conn.execute(
                'UPDATE stat_list SET sHealth = ?, sAtk = ?, sDef = ?, sSpAtk = ?, sSpDef = ?, sSpd = ? WHERE statID = ?',
                [stats.ivs.hp, stats.ivs.attack, stats.ivs.defense, stats.ivs.specialAttack, stats.ivs.specialDefense, stats.ivs.speed, choiceData[0].statIV]
            );

            // Update total stats
            await conn.execute(
                'UPDATE stat_list SET sHealth = ?, sAtk = ?, sDef = ?, sSpAtk = ?, sSpDef = ?, sSpd = ? WHERE statID = ?',
                [stats.total.hp, stats.total.attack, stats.total.defense, stats.total.specialAttack, stats.total.specialDefense, stats.total.speed, choiceData[0].statTotal]
            );

            await conn.commit();
            res.json({ success: true, message: 'Pokemon updated successfully' });
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Error updating Pokemon:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/fullview/:pokemonName/:generation?', async(req,res) => {
    try {
        const data = await pokeAPI.getFullPokemonByName(req.params.pokemonName,req.params.generation);
        const matchups = await pokeAPI.getTypeMatchups(data.types[0],data.types[1],req.params.generation);
        if (!data) {
            throw new Error('Pokemon not found');
        }

        // Get user's teams if they're logged in
        let userTeams = [];
        if (req.session.passport?.user) {
            const conn = await pool.getConnection();
            // First get the teams
            const [teams] = await conn.execute(
                'SELECT teamID, teamname, generation, pokemon1, pokemon2, pokemon3, pokemon4, pokemon5, pokemon6 FROM teams WHERE ownerID = ? ORDER BY created_at DESC',
                [req.session.passport.user.userID]
            );
            
            // For each team, get the Pokemon names
            for (const team of teams) {
                const pokemonSlots = [];
                for (let i = 1; i <= 6; i++) {
                    const pokemonId = team[`pokemon${i}`];
                    if (pokemonId) {
                        const [pokemonData] = await conn.execute(`
                            SELECT pbd.name 
                            FROM pokemon p
                            JOIN poke_base_data pbd ON p.baseDataID = pbd.baseID
                            WHERE p.pokemonID = ?
                        `, [pokemonId]);
                        pokemonSlots.push(pokemonData[0]?.name || null);
                    } else {
                        pokemonSlots.push(null);
                    }
                }
                team.pokemon = pokemonSlots;
            }
            userTeams = teams;
            conn.release();
        }

        res.render('fullpokemonview', { 
            pokemon: data, 
            matchups: matchups, 
            selectedTeam: req.session.selectedTeam || null,
            generation: req.params.generation,
            userTeams: userTeams
        });
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
    }
})

// Add this new route to handle swapping Pokemon
router.post('/swap-slot', async (req, res) => {
    try {
        const userID = getAuthenticatedUserId(req);
        if (!userID) {
            return res.status(401).send('Authentication required');
        }

        const teamID = parsePositiveInt(req.body.teamID);
        const slotNumber = parseSlotNumber(req.body.slotNumber);

        if (!teamID || slotNumber === null) {
            return res.status(400).send('Invalid team or slot');
        }

        const conn = await pool.getConnection();
        // Get the team's generation from the database
        const [teamData] = await conn.execute(`
            SELECT generation FROM teams WHERE teamID = ? AND ownerID = ?
        `, [teamID, userID]);
        conn.release();

        if (!teamData[0]) {
            return res.status(403).send('Team not found or not owned by user');
        }

        // Get the generation number directly
        const generationNumber = teamData[0]?.generation || '1';

        // Store the team, slot, and generation information in the session
        req.session.selectedTeam = {
            teamID,
            slotNumber,
            generation: generationNumber,
            isSwap: true  // Add this flag to indicate it's a swap operation
        };
        
        // Redirect to the Pokédex page with the correct generation
        res.redirect(`/poke/dex/${generationNumber}`);
    } catch (error) {
        console.log('Swap slot error:', error);
        res.status(500).send('Error initiating swap');
    }
});

// Helper functions for Pokemon operations
async function deletePokemonAndRelatedData(conn, pokemonID) {
    const [pokemonData] = await conn.execute(
        'SELECT baseDataID, choiceDataID, moveSetID FROM pokemon WHERE pokemonID = ?',
        [pokemonID]
    );

    if (!pokemonData[0]) return;

    await conn.execute('DELETE FROM pokemon WHERE pokemonID = ?', [pokemonID]);
    
    if (pokemonData[0].baseDataID) {
        const [baseData] = await conn.execute(
            'SELECT baseStatID FROM poke_base_data WHERE baseID = ?',
            [pokemonData[0].baseDataID]
        );
        await conn.execute('DELETE FROM poke_base_data WHERE baseID = ?', [pokemonData[0].baseDataID]);
        if (baseData[0]?.baseStatID) {
            await conn.execute('DELETE FROM stat_list WHERE statID = ?', [baseData[0].baseStatID]);
        }
    }

    if (pokemonData[0].choiceDataID) {
        const [choiceData] = await conn.execute(
            'SELECT statEV, statIV, statTotal FROM poke_choice_data WHERE choiceID = ?',
            [pokemonData[0].choiceDataID]
        );
        await conn.execute('DELETE FROM poke_choice_data WHERE choiceID = ?', [pokemonData[0].choiceDataID]);
        
        const statIDs = [choiceData[0]?.statEV, choiceData[0]?.statIV, choiceData[0]?.statTotal].filter(Boolean);
        for (const statID of statIDs) {
            await conn.execute('DELETE FROM stat_list WHERE statID = ?', [statID]);
        }
    }

    if (pokemonData[0].moveSetID) {
        await conn.execute('DELETE FROM poke_moveset WHERE moveSetID = ?', [pokemonData[0].moveSetID]);
    }
}

async function createPokemonStats(conn, pokemonData) {
    const [baseStats] = await conn.execute(
        'INSERT INTO stat_list (statType, sHealth, sDef, sSpDef, sAtk, sSpAtk, sSpd) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['base',
            pokemonData.stats.find(s => s.name === 'hp').base_stat,
            pokemonData.stats.find(s => s.name === 'defense').base_stat,
            pokemonData.stats.find(s => s.name === 'special-defense').base_stat,
            pokemonData.stats.find(s => s.name === 'attack').base_stat,
            pokemonData.stats.find(s => s.name === 'special-attack').base_stat,
            pokemonData.stats.find(s => s.name === 'speed').base_stat
        ]
    );

    const [evStats] = await conn.execute(
        'INSERT INTO stat_list (statType, sHealth, sDef, sSpDef, sAtk, sSpAtk, sSpd) VALUES (?, 0, 0, 0, 0, 0, 0)',
        ['ev']
    );

    const [ivStats] = await conn.execute(
        'INSERT INTO stat_list (statType, sHealth, sDef, sSpDef, sAtk, sSpAtk, sSpd) VALUES (?, 31, 31, 31, 31, 31, 31)',
        ['iv']
    );

    const [totalStats] = await conn.execute(
        'INSERT INTO stat_list (statType, sHealth, sDef, sSpDef, sAtk, sSpAtk, sSpd) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['total',
            pokemonData.stats.find(s => s.name === 'hp').base_stat,
            pokemonData.stats.find(s => s.name === 'defense').base_stat,
            pokemonData.stats.find(s => s.name === 'special-defense').base_stat,
            pokemonData.stats.find(s => s.name === 'attack').base_stat,
            pokemonData.stats.find(s => s.name === 'special-attack').base_stat,
            pokemonData.stats.find(s => s.name === 'speed').base_stat
        ]
    );

    return {
        baseStatsId: baseStats.insertId,
        evStatsId: evStats.insertId,
        ivStatsId: ivStats.insertId,
        totalStatsId: totalStats.insertId
    };
}

async function createPokemonEntry(conn, pokemonData, generation, statsIds) {
    const [type1Result] = await conn.execute(
        'SELECT typeID FROM type_ref WHERE typeName = ?',
        [pokemonData.types[0]]
    );
    const [type2Result] = await conn.execute(
        'SELECT typeID FROM type_ref WHERE typeName = ?',
        [pokemonData.types[1] || null]
    );

    const [baseData] = await conn.execute(
        'INSERT INTO poke_base_data (dexNum, name, typeMain, typeSecond, baseStatID, spriteURL) VALUES (?, ?, ?, ?, ?, ?)',
        [pokemonData.dex_number, pokemonData.name, type1Result[0].typeID, type2Result[0]?.typeID || null, statsIds.baseStatsId, pokemonData.sprite_url]
    );

    const [choiceData] = await conn.execute(
        'INSERT INTO poke_choice_data (gender, shiny, nature, friendship, ability, statEV, statIV, statTotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['male', false, 'hardy', 0, pokemonData.abilities[0], statsIds.evStatsId, statsIds.ivStatsId, statsIds.totalStatsId]
    );

    const [moveSet] = await conn.execute(
        'INSERT INTO poke_moveset (move1, move2, move3, move4) VALUES (?, ?, ?, ?)',
        ['-', '-', '-', '-']
    );

    const [pokemon] = await conn.execute(
        'INSERT INTO pokemon (generation, baseDataID, choiceDataID, moveSetID) VALUES (?, ?, ?, ?)',
        [generation, baseData.insertId, choiceData.insertId, moveSet.insertId]
    );

    return pokemon.insertId;
}

// Main route handler
router.post('/add-to-team', async (req, res) => {
    try {
        const userID = getAuthenticatedUserId(req);
        if (!userID) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        if (!req.session.selectedTeam) {
            throw new Error('No team selected');
        }

        const { teamID, slotNumber, isSwap, generation } = req.session.selectedTeam;
        const { pokemonData } = req.body;

        const parsedTeamID = parsePositiveInt(teamID);
        const parsedSlotNumber = parseSlotNumber(slotNumber);
        const parsedGeneration = Number.parseInt(generation, 10);

        if (!parsedTeamID || parsedSlotNumber === null || !Number.isInteger(parsedGeneration) || parsedGeneration < 1 || parsedGeneration > 9) {
            return res.status(400).json({ success: false, error: 'Invalid team selection context' });
        }

        if (!isValidPokemonPayload(pokemonData)) {
            return res.status(400).json({ success: false, error: 'Invalid pokemon payload' });
        }

        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();
            const dbSlotNumber = parsedSlotNumber + 1;

            const [teamRows] = await conn.execute(
                `SELECT pokemon1, pokemon2, pokemon3, pokemon4, pokemon5, pokemon6
                 FROM teams
                 WHERE teamID = ? AND ownerID = ?
                 FOR UPDATE`,
                [parsedTeamID, userID]
            );

            if (!teamRows[0]) {
                throw new Error('Team not found or not owned by user');
            }

            if (isSwap) {
                const currentPokemonID = teamRows[0][`pokemon${dbSlotNumber}`];

                if (currentPokemonID) {
                    await conn.execute(
                        `UPDATE teams SET
                            pokemon1 = CASE WHEN ? = 1 THEN ? ELSE pokemon1 END,
                            pokemon2 = CASE WHEN ? = 2 THEN ? ELSE pokemon2 END,
                            pokemon3 = CASE WHEN ? = 3 THEN ? ELSE pokemon3 END,
                            pokemon4 = CASE WHEN ? = 4 THEN ? ELSE pokemon4 END,
                            pokemon5 = CASE WHEN ? = 5 THEN ? ELSE pokemon5 END,
                            pokemon6 = CASE WHEN ? = 6 THEN ? ELSE pokemon6 END
                         WHERE teamID = ? AND ownerID = ?`,
                        [
                            dbSlotNumber, null,
                            dbSlotNumber, null,
                            dbSlotNumber, null,
                            dbSlotNumber, null,
                            dbSlotNumber, null,
                            dbSlotNumber, null,
                            parsedTeamID,
                            userID
                        ]
                    );
                    await deletePokemonAndRelatedData(conn, currentPokemonID);
                }
            }

            const statsIds = await createPokemonStats(conn, pokemonData);
            const newPokemonId = await createPokemonEntry(conn, pokemonData, String(parsedGeneration), statsIds);

            await conn.execute(
                `UPDATE teams SET
                    pokemon1 = CASE WHEN ? = 1 THEN ? ELSE pokemon1 END,
                    pokemon2 = CASE WHEN ? = 2 THEN ? ELSE pokemon2 END,
                    pokemon3 = CASE WHEN ? = 3 THEN ? ELSE pokemon3 END,
                    pokemon4 = CASE WHEN ? = 4 THEN ? ELSE pokemon4 END,
                    pokemon5 = CASE WHEN ? = 5 THEN ? ELSE pokemon5 END,
                    pokemon6 = CASE WHEN ? = 6 THEN ? ELSE pokemon6 END
                 WHERE teamID = ? AND ownerID = ?`,
                [
                    dbSlotNumber, newPokemonId,
                    dbSlotNumber, newPokemonId,
                    dbSlotNumber, newPokemonId,
                    dbSlotNumber, newPokemonId,
                    dbSlotNumber, newPokemonId,
                    dbSlotNumber, newPokemonId,
                    parsedTeamID,
                    userID
                ]
            );

            await conn.commit();
            delete req.session.selectedTeam;
            res.json({ success: true, message: isSwap ? 'Pokemon swapped successfully' : 'Pokemon added to team' });
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.log('Add/Swap team error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;