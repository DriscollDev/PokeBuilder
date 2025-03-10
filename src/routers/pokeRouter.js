import express from 'express';
import pokeAPI from '../controllers/pokeAPI.js';
import pool from '../controllers/db.js'; 

const router = express.Router();

// Add this new route near the top with other routes
router.post('/select-slot', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        // Get the team's generation from the database
        const [teamData] = await conn.execute(`
            SELECT generation FROM teams WHERE teamID = ?
        `, [req.body.teamID]);
        conn.release();

        // Get the generation number directly
        const generationNumber = teamData[0]?.generation || '1';

        // Store the team, slot, and generation information in the session
        req.session.selectedTeam = {
            teamID: req.body.teamID,
            slotNumber: req.body.slotNumber,
            generation: generationNumber
        };
        
        // If it's a JSON request, send JSON response
        if (req.headers['content-type'] === 'application/json') {
            res.json({ success: true });
        } else {
            // Otherwise, redirect to the Pokédex page
            res.redirect(`/poke/dex/${generationNumber}`);
        }
    } catch (error) {
        console.log('Select slot error:', error);
        if (req.headers['content-type'] === 'application/json') {
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
                pt1.type as primary_type,
                pt2.type as secondary_type
            FROM dex_mon dm
            JOIN pokedex_entries pe ON dm.id = pe.pokemon_id
                AND pe.dex_name = ?
            LEFT JOIN pokemon_types pt1 ON dm.id = pt1.pokemon_id 
                AND pt1.slot = 1
            LEFT JOIN pokemon_types pt2 ON dm.id = pt2.pokemon_id 
                AND pt2.slot = 2
            ORDER BY pe.entry_number
        `, [dexName]);
        
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

router.get('/mon/:name', pokeAPI.getFormattedPokemonByName);


router.get('/editpokemon/:pokemonID', async(req,res) => {
    res.render('editpokemon')
})
router.get('/fullview/:pokemonName', async(req,res) => {
    res.render('fullpokemonview')
})

// Add this new route to handle swapping Pokemon
router.post('/swap-slot', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        // Get the team's generation from the database
        const [teamData] = await conn.execute(`
            SELECT generation FROM teams WHERE teamID = ?
        `, [req.body.teamID]);
        conn.release();
        console.log(teamData);
        // Get the generation number directly
        const generationNumber = teamData[0]?.generation || '1';

        // Store the team, slot, and generation information in the session
        req.session.selectedTeam = {
            teamID: req.body.teamID,
            slotNumber: req.body.slotNumber,
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
        'INSERT INTO stat_list (statType, sHealth, sDef, sSpDef, sAtk, sSpAtk, sSpd) VALUES (?, 0, 0, 0, 0, 0, 0)',
        ['total']
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
        if (!req.session.selectedTeam) {
            throw new Error('No team selected');
        }

        const { teamID, slotNumber, isSwap, generation } = req.session.selectedTeam;
        const { pokemonData } = req.body;
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();
            const dbSlotNumber = parseInt(slotNumber) + 1;

            if (isSwap) {
                const [currentPokemon] = await conn.execute(
                    `SELECT pokemon${dbSlotNumber} as pokemonID FROM teams WHERE teamID = ?`,
                    [teamID]
                );

                if (currentPokemon[0]?.pokemonID) {
                    await conn.execute(
                        `UPDATE teams SET pokemon${dbSlotNumber} = NULL WHERE teamID = ?`,
                        [teamID]
                    );
                    await deletePokemonAndRelatedData(conn, currentPokemon[0].pokemonID);
                }
            }

            const statsIds = await createPokemonStats(conn, pokemonData);
            const newPokemonId = await createPokemonEntry(conn, pokemonData, generation, statsIds);

            await conn.execute(
                `UPDATE teams SET pokemon${dbSlotNumber} = ? WHERE teamID = ?`,
                [newPokemonId, teamID]
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