import express from 'express';
import adminController from '../controllers/adminController.js'; 

const router = express.Router();

// Middleware to check if user is admin (authorizationLevel >= 1)
const checkAdminAuth = async (req, res, next) => {
    try {
        if (!req.isAuthenticated()) {
            return res.redirect('/auth/login');
        }

        const currentUserLevel = await adminController.getAuthorizationLevel(req.session.passport.user.userID);

        if (!currentUserLevel || currentUserLevel < 1) {
            return res.status(403).render('error', { 
                title: 'Access Denied',
                message: 'You do not have admin privileges to access this page.' 
            });
        }

        req.currentUserLevel = currentUserLevel;

        next();
    } catch (error) {
        console.error('Admin auth check error:', error);
        res.status(500).send('Error checking admin privileges');
    }
};

// Apply admin auth middleware to all routes
router.use(checkAdminAuth);

// Admin dashboard - view all users
router.get('/', async (req, res) => {
    try {
        const users = await adminController.getAllUsers();

        res.render('admin', {
            title: 'Admin Panel',
            users: users,
            currentUserLevel: req.currentUserLevel,
            currentUserID: req.session.passport.user.userID
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error loading admin panel');
    }
});

// Get user details
router.get('/user/:userID', async (req, res) => {
    try {
        const user = await adminController.getUserById(req.params.userID);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const actingUserLevel = req.currentUserLevel;

        if (!actingUserLevel || actingUserLevel < 1) {
            return res.status(403).json({ error: 'Insufficient permissions to view this user' });
        }

        const targetLevel = Number.parseInt(user.authorizationLevel, 10);

        // Optional hardening: prevent viewing details of users at or above your level, unless owner
        if (actingUserLevel !== 3 && targetLevel >= actingUserLevel) {
            return res.status(403).json({ error: 'Insufficient permissions to view this user' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Error fetching user details' });
    }
});

// Delete user
router.post('/delete-user', async (req, res) => {
    try {
        const { userID } = req.body;

        const actingUserLevel = req.currentUserLevel;

        if (!actingUserLevel || actingUserLevel < 1) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions to delete users'
            });
        }

        const targetUser = await adminController.getUserById(userID);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const targetLevel = Number.parseInt(targetUser.authorizationLevel, 10);

        // Prevent admin from deleting themselves
        if (userID == req.session.passport.user.userID) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete your own account' 
            });
        }

        // Enforce cascading delete permissions
        if (actingUserLevel === 1) {
            if (targetLevel !== 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions to delete this user'
                });
            }
        } else if (actingUserLevel === 2) {
            if (!(targetLevel === 0 || targetLevel === 1)) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions to delete this user'
                });
            }
        } else if (actingUserLevel < 3) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions to delete this user'
            });
        }

        const result = await adminController.deleteUser(userID);
        res.json(result);
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error deleting user' 
        });
    }
});

// Update user authorization level
router.post('/update-auth-level', async (req, res) => {
    try {
        const { userID, authorizationLevel } = req.body;

        const actingUserLevel = req.currentUserLevel;

        if (!actingUserLevel || actingUserLevel < 1) {
            return res.status(403).json({ 
                success: false, 
                error: 'Insufficient permissions to change authorization levels' 
            });
        }

        const targetUser = await adminController.getUserById(userID);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const targetLevel = Number.parseInt(targetUser.authorizationLevel, 10);
        const requestedLevel = Number.parseInt(authorizationLevel, 10);

        // Prevent admin from changing their own level
        if (userID == req.session.passport.user.userID) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot change your own authorization level' 
            });
        }

        // Enforce cascading rules for auth-level updates
        if (actingUserLevel === 3) {
            // Owner can set any level on other users (0–3)
            if (![0, 1, 2, 3].includes(requestedLevel)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid authorization level'
                });
            }
        } else if (actingUserLevel === 2) {
            // Level 2 can modify users below them (levels 0 and 1) between 0 and 1
            const targetIsEditable = targetLevel === 0 || targetLevel === 1;
            const requestedIsAllowed = requestedLevel === 0 || requestedLevel === 1;
            if (!targetIsEditable || !requestedIsAllowed) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions to change this user\'s level'
                });
            }
        } else {
            // Level 1 and below cannot change auth levels
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions to change authorization levels'
            });
        }

        const result = await adminController.updateAuthLevel(userID, authorizationLevel);
        res.json(result);
    } catch (error) {
        console.error('Error updating authorization level:', error);
        res.status(500).json({ 
            success: false, 
            // VULN TMI: previously surfaced error.message from the admin controller, leaking internal details.
            error: 'Error updating authorization level' 
        });
    }
});
export default router;