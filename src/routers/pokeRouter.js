import express from 'express';
import pokeAPI from '../controllers/pokeAPI.js';
import pool from '../controllers/db.js'; 

const router = express.Router();

/*
router.get('/pokemon/:generation', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [pokemon] = await connection.execute(`
            SELECT 
                gm.pokemon_id,
                gm.name,
                gm.species_name,
                gm.sprite_url,
                gg.primary_type,
                gg.secondary_type,
                gg.pokedex_number,
                gg.generation
            FROM grid_mon gm
            JOIN grid_gen gg ON gm.pokemon_id = gg.pokemon_id
            WHERE gg.generation = ?
            ORDER BY gg.pokedex_number
        `, [req.params.generation]);
        connection.release();
        res.json(pokemon);
    } catch (error) {
        console.log('Pokemon filter API error:', error);
        res.status(500).json({ error: 'Error fetching filtered Pokemon data' });
    }
});
*/
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
            pokemon: pokemon
        });
    } catch (error) {
        console.log('Pokedex error:', error);
        res.status(500).send('Error loading Pokédex');
    }
});

/*
Gen <-> DexName
1 = kanto
2 = updated-johto
3 = updated-hoenn
4 = extended-sinnoh
5 = updated-unova
6 = kalos-central
7 = updated-alola
8 = galar
9 = paldea
*/


router.get('/mon/:name', pokeAPI.getFormattedPokemonByName);



router.get('/test',async(req, res) =>{
    try{
        const pokemon = await pokeAPI.populateGridMon(req);
        res.json(pokemon)
    }
    catch (error) {
        console.log('Test route error:', error);
        res.status(500).send('Error loading test Pokédex');
    }
})

router.get('/test2', async (req, res) => {
    /*
                -- Create Pokemon base table
        CREATE TABLE dex_mon (
            id INT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            sprite_url VARCHAR(255),
            box_sprite VARCHAR(255),
            generation VARCHAR(50)
        );

        -- Create Pokedex Entries table (one-to-many with dex_mon)
        CREATE TABLE pokedex_entries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pokemon_id INT,
            entry_number INT,
            dex_name VARCHAR(100),
            dex_id INT,
            FOREIGN KEY (pokemon_id) REFERENCES dex_mon(id)
        );

        -- Create Types table (one-to-many with dex_mon)
        CREATE TABLE pokemon_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pokemon_id INT,
            slot INT,
            type VARCHAR(50),
            FOREIGN KEY (pokemon_id) REFERENCES dex_mon(id)
        );

        -- Create Past Types table to track type changes over generations
        CREATE TABLE past_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pokemon_id INT,
            generation VARCHAR(50),
            FOREIGN KEY (pokemon_id) REFERENCES dex_mon(id)
        );

        -- Create Past Type Details table
        CREATE TABLE past_type_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            past_type_id INT,
            slot INT,
            type VARCHAR(50),
            FOREIGN KEY (past_type_id) REFERENCES past_types(id)
        );

        -- Indexes for performance
        CREATE INDEX idx_pokemon_name ON dex_mon(name);
        CREATE INDEX idx_pokedex_pokemon ON pokedex_entries(pokemon_id);
        CREATE INDEX idx_types_pokemon ON pokemon_types(pokemon_id);
        CREATE INDEX idx_past_types_pokemon ON past_types(pokemon_id);
    */
    try {
        const pokemon = await pokeAPI.populateGridMon(req);
        
        const conn = await pool.getConnection();
        
        for (const mon of pokemon) {
            // Insert base Pokemon data
            await conn.execute(`
                INSERT INTO dex_mon (id, name, sprite_url, box_sprite, generation)
                VALUES (?, ?, ?, ?, ?)
            `, [mon.id, mon.name, mon.sprite_url, mon.box_sprite, mon.generation]);

            // Insert Pokedex entries
            for (const entry of mon.dex_entries) {
                await conn.execute(`
                    INSERT INTO pokedex_entries (pokemon_id, entry_number, dex_name, dex_id)
                    VALUES (?, ?, ?, ?)
                `, [mon.id, entry.entry_number, entry.dex_name, entry.dex_id]);
            }

            // Insert current types
            for (const type of mon.types) {
                await conn.execute(`
                    INSERT INTO pokemon_types (pokemon_id, slot, type)
                    VALUES (?, ?, ?)
                `, [mon.id, type.slot, type.type]);
            }

            // Insert past types if they exist
            for (const pastType of mon.past_types) {
                // Insert past type entry
                const [result] = await conn.execute(`
                    INSERT INTO past_types (pokemon_id, generation)
                    VALUES (?, ?)
                `, [mon.id, pastType.generation]);

                // Insert past type details
                for (const type of pastType.types) {
                    await conn.execute(`
                        INSERT INTO past_type_details (past_type_id, slot, type)
                        VALUES (?, ?, ?)
                    `, [result.insertId, type.slot, type.type]);
                }
            }
        }

        conn.release();
        res.json({ message: `Successfully populated database with ${pokemon.length} Pokemon` });
    } catch (error) {
        console.log('Test route error:', error);
        res.status(500).send('Error loading test Pokédex');
    }
});

export default router;
