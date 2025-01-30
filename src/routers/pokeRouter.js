import express from 'express';
import pokeAPI from '../controllers/pokeAPI.js';
import db from '../controllers/db.js';  // Assuming you have a database connection setup

const router = express.Router();


router.get('/api/pokemon/:generation', async (req, res) => {
    try {
        const [pokemon] = await db.execute(`
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

        res.json(pokemon);
    } catch (error) {
        console.error('Pokemon filter API error:', error);
        res.status(500).json({ error: 'Error fetching filtered Pokemon data' });
    }
});
// Pokedex routes
router.get('/', async (req, res) => {
    try {
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

        res.render('pokedex', {
            title: 'Pokédex',
            pokemon: pokemon
        });
    } catch (error) {
        console.error('Pokedex error:', error);
        res.status(500).send('Error loading Pokédex');
    }
});

router.get('/:name', pokeAPI.getPokemon);

export default router;
