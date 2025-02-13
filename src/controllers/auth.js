import bcrypt from "bcryptjs"
import pool from "./db.js"
import passport from 'passport';
import LocalStrategy from 'passport-local';

// Configure passport to use local strategy
passport.use(
    new LocalStrategy(async function verify(username, password, cb) {
        try {
            // Get database connection
            const conn = await pool.getConnection();
            
            // Find user by username
            const [rows] = await conn.query("SELECT * FROM user WHERE username = ?", [username]);
            pool.releaseConnection(conn);
            
            const user = rows[0];
            
            // Check if user exists
            if (!user) {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return cb(null, false, { message: 'Incorrect username or password.' }); 
            }

            console.log(`User ${user.username} authenticated`);
            //console.log(user);
            return cb(null, user);

        } catch (err) {
            console.error('Authentication error:', err);
            return cb(err);
        }
    })
);

// Serialize user for the session
passport.serializeUser((user, cb) => {
    process.nextTick(() => {
        cb(null, { userId: user.userId, username: user.username });
    });
});

// Deserialize user from the session  
passport.deserializeUser((user, cb) => {
    process.nextTick(() => {
        return cb(null, user);
    });
});

const authController = {
    registerUser: async (req, res, next) => {
        const { username, password} = req.body;
        console.log("Registering user", username, password);

        // Input validation
        if (!username || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        /*
        if (password !== password_confirm) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        */
        try {
            const conn = await pool.getConnection();

            // Check if username already exists
            const [existingUsers] = await conn.query(
                "SELECT username FROM user WHERE username = ?", 
                [username]
            );
            
            if (existingUsers.length > 0) {
                pool.releaseConnection(conn);
                return res.status(400).json({ error: "Username already exists" });
            }

            // Hash password and create user
            const hash = await bcrypt.hash(password, 10);
            await conn.query(
                "INSERT INTO user (username, password) VALUES (?, ?)", 
                [username, hash]
            );
            pool.releaseConnection(conn);
            next();

        } catch (err) {
            console.error('Registration error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    loginUser: async (req, res, next) => {
        try {
            const conn = await pool.getConnection();
            const [users] = await conn.query(
                "SELECT * FROM user WHERE username = ?", 
                [req.body.username]
            );
            pool.releaseConnection(conn);

            if (users.length === 0) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const user = users[0];
            const isMatch = await bcrypt.compare(req.body.password, user.password);
            
            if (!isMatch) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
            //req.session.passport.user.userID = user.userID;
            //req.session.save();
            next();

        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default authController;