import pool from './db.js';

async function fetchAuthorizationLevel(userID) {
    const conn = await pool.getConnection();
    try {
        const [users] = await conn.execute(
            'SELECT authorizationLevel FROM user WHERE userID = ?',
            [userID]
        );

        if (!users[0]) {
            return null;
        }

        return Number.parseInt(users[0].authorizationLevel, 10);
    } finally {
        conn.release();
    }
}

const adminController = {
    // Check if user has admin privileges (authorizationLevel >= 1)
    checkAdminAuth: async (userID) => {
        try {
            const level = await fetchAuthorizationLevel(userID);
            return level !== null && level >= 1;
        } catch (error) {
            console.error('Admin auth check error:', error);
            throw error;
        }
    },

    // Expose raw authorization level for use in routes
    getAuthorizationLevel: fetchAuthorizationLevel,

    // Get all users
    getAllUsers: async () => {
        try {
            const conn = await pool.getConnection();
            const [users] = await conn.execute(
                'SELECT userID, username, authorizationLevel, date_created FROM user ORDER BY authorizationLevel DESC'
            );
            conn.release();

            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Get a specific user by ID
    getUserById: async (userID) => {
        try {
            const conn = await pool.getConnection();
            const [users] = await conn.execute(
                'SELECT userID, username, authorizationLevel, date_created FROM user WHERE userID = ?',
                [userID]
            );
            conn.release();

            return users[0] || null;
        } catch (error) {
            console.error('Error fetching user details:', error);
            throw error;
        }
    },

    // Delete a user and all their associated data
    deleteUser: async (userID) => {
        try {
            const conn = await pool.getConnection();

            // Start transaction
            await conn.beginTransaction();

            try {
                // Delete all teams owned by the user
                await conn.execute(
                    'DELETE FROM pokemon WHERE pokemonID IN (SELECT pokemonID FROM teams WHERE ownerID = ?)',
                    [userID]
                );
                await conn.execute('DELETE FROM teams WHERE ownerID = ?', [userID]);

                // Delete the user
                await conn.execute('DELETE FROM user WHERE userID = ?', [userID]);

                await conn.commit();
                conn.release();

                return { success: true, message: 'User deleted successfully' };
            } catch (error) {
                await conn.rollback();
                conn.release();
                throw error;
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // Update user's authorization level
    updateAuthLevel: async (userID, authorizationLevel) => {
        try {
            // Validate authorization level
            if (![0, 1, 2, 3].includes(Number.parseInt(authorizationLevel, 10))) {
                throw new Error('Invalid authorization level');
            }

            const conn = await pool.getConnection();
            await conn.execute(
                'UPDATE user SET authorizationLevel = ? WHERE userID = ?',
                [authorizationLevel, userID]
            );
            conn.release();

            return { success: true, message: 'Authorization level updated' };
        } catch (error) {
            console.error('Error updating authorization level:', error);
            throw error;
        }
    }
};

export default adminController;
