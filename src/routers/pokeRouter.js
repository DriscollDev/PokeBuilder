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
        console.error('Pokemon filter API error:', error);
        res.status(500).json({ error: 'Error fetching filtered Pokemon data' });
    }
});
*/
// Pokedex routes
router.get('/dex', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const [pokemon] = await db.execute(`
            SELECT 
                gm.pokemon_id,
                gm.name,
                gm.species_name,
                gm.sprite_url,
                gg.generation,
                gg.primary_type,
                gg.secondary_type,
                gg.pokedex_number
            FROM grid_mon gm
            JOIN grid_gen gg ON gm.pokemon_id = gg.pokemon_id
            ORDER BY gg.pokedex_number
        `);
        conn.release();
        res.render('pokedex', {
            title: 'Pokédex',
            pokemon: pokemon
        });
    } catch (error) {
        console.error('Pokedex error:', error);
        res.status(500).send('Error loading Pokédex');
    }
});
router.get('/dex2/:game', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const [pokemon] = await conn.execute(`
            SELECT 
                gm.pokemon_id,
                gm.name,
                gm.species_name,
                gm.sprite_url,
                gg.generation,
                gg.primary_type,
                gg.secondary_type,
                gg.pokedex_number
            FROM grid_mon gm
            JOIN grid_gen gg ON gm.pokemon_id = gg.pokemon_id
            JOIN grid_game_index gi ON gm.pokemon_id = gi.pokemon_id
            WHERE gi.version_name = ?
            ORDER BY gg.pokedex_number
        `, [req.params.game]);

        conn.release();
        res.render('pokedex', {
            title: 'Pokédex',
            pokemon: pokemon
        });
    } catch (error) {
        console.log('Pokedex error:', error);
        res.status(500).send('Error loading Pokédex');
    }
});

router.get('/mon/:name', pokeAPI.getFormattedPokemonByName);

router.get('/test', pokeAPI.populateDB);

export default router;
