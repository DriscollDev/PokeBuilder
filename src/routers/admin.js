import express from 'express';
import adminController from '../controllers/adminController.js'; 

const router = express.Router();

// Middleware to check if user is admin (authorizationLevel 3)
const checkAdminAuth = async (req, res, next) => {
    try {
        if (!req.isAuthenticated()) {
            return res.redirect('/auth/login');
        }

        const isAdmin = await adminController.checkAdminAuth(req.session.passport.user.userID);

        if (!isAdmin) {
            return res.status(403).render('error', { 
                title: 'Access Denied',
                message: 'You do not have admin privileges to access this page.' 
            });
        }

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
            users: users
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

        // Prevent admin from deleting themselves
        if (userID == req.session.passport.user.userID) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete your own account' 
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

        // Prevent admin from changing their own level
        if (userID == req.session.passport.user.userID) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot change your own authorization level' 
            });
        }

        const result = await adminController.updateAuthLevel(userID, authorizationLevel);
        res.json(result);
    } catch (error) {
        console.error('Error updating authorization level:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Error updating authorization level' 
        });
    }
});
export default router;