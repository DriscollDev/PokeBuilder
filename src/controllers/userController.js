import pool from './db.js';
import pokeAPI from './pokeAPI.js';

const userController = {
    getUserData: async (req, res, next) => {
        try {
            const conn = await pool.getConnection();
            const [rows] = await conn.query('SELECT * FROM user WHERE userID = ?', [req.session.passport.user.userID]);
            pool.releaseConnection(conn);
            return rows[0]
        }
        catch (error) {
            console.log('Error fetching current user:', error);
            return next(error);
        }
    },
    
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