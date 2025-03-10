import pool from './db.js';
import pokeAPI from './pokeAPI.js';

const userController = {

    
    getUserByName: async (req, res, next) => {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query('SELECT * FROM user WHERE username = ?', [req.params.username]);
            pool.releaseConnection(conn);
            res.json(rows);
        } catch (error) {
            console.log('Error fetching user :', error);
            next(error);
        }
    },

    getUserTeams: async (req, res, next) => {
        try {
             
            const [rows] = await pool.query('SELECT * FROM teams WHERE ownerID = ?', [req.user.id]);
            res.json(rows);
        } catch (error) {
            console.log('Error fetching user teams:', error);
            next(error);
        }
    },

    getTeam: async (req, res, next) => {
        try {
            const [rows] = await pool.query('SELECT * FROM teams WHERE teamID = ?', [req.params.id]);
            res.json(rows);
        } catch (error) {
            console.log('Error fetching team:', error);
            next(error);
        }
    },

};

export default userController;