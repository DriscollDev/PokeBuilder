import bcrypt from "bcryptjs";
import pool from "./db.js";
import passport from "passport";
import LocalStrategy from "passport-local";

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
            console.log('Authentication error:', err);
            return cb(err);
        }
    })
);

// Serialize user for the session
passport.serializeUser((user, cb) => {
    //console.log("Serializing user", user);
    process.nextTick(() => {
        cb(null, { userID: user.userID, username: user.username });
    });
});

// Deserialize user from the session  
passport.deserializeUser((user, cb) => {
    //console.log("DeSerializing user", user);
    process.nextTick(() => {
        return cb(null, user);
    });
});

const authController = {
    registerUser: async (req, res, next) => {
        const { username, password } = req.body;
        //console.log("Registering user", username);

        // Input validation
        if (!username || !password) {
            return res.render("signup", { 
                title: "Sign Up",
                errorMessage: "All fields are required." 
            });
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
                return res.render("signup", { 
                    title: "Sign Up",
                    errorMessage: "Username already exists." 
                });
            }

            // Hash password and create user
            const hash = await bcrypt.hash(password, 10);
            await conn.query(
                "INSERT INTO user (username, password) VALUES (?, ?)", 
                [username, hash]
            );
            pool.releaseConnection(conn);
            
            // Redirect to login after successful registration
            return res.redirect("/auth/login");

        } catch (err) {
            console.log('Registration error:', err);
            return res.render("signup", { 
                title: "Sign Up",
                errorMessage: "Internal server error. Please try again." 
            });
        }
    },

    loginUser: async (req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                // If incorrect username or password, return specific error type
                return res.render("login", { 
                    title: "Login",
                    errorMessage: "Incorrect username or password.",
                    errorType: "password" // Can be 'username' or 'password'
                });
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                return res.redirect("/dash"); // Redirect to dashboard on success
            });
        })(req, res, next);
    }

    
    
}



export default authController;
