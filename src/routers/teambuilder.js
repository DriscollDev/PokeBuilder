import { Router } from 'express';
const router = Router();

// Import the team controller
import teamController from '../controllers/teamController.js';

function getAuthenticatedUserId(req) {
  return req.session?.passport?.user?.userID || null;
}

function requireAuth(req, res, next) {
  if (!getAuthenticatedUserId(req)) {
    return res.status(401).send('Authentication required');
  }
  next();
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

// Get teams by user ID
router.get('/', requireAuth, async function (req, res, next) {
  const teams = await teamController.getTeamsByCurrentUser(req);
  //console.log(teams)
  res.render("teamhome", {
    title: 'Team View',
    teams: teams
  });
});



// Team Builder Page - Now fetches team data before rendering
router.post('/builder', requireAuth, async function(req, res, next) {
  try {
    const ownerID = getAuthenticatedUserId(req);
    const teamID = parsePositiveInt(req.body.teamID);
    if (!teamID) {
      return res.status(400).send('Invalid team ID');
    }

    const team = await teamController.getTeamById(teamID, ownerID);
    res.render("teambuilder", { 
      title: 'Team Builder',
      team: team
    });
  } catch (error) {
    console.log('Error loading team:', error);
    res.status(500).send('Error loading team');
  }
});

// Create team
router.post('/builder/create', requireAuth, teamController.createTeam);

// Update team
router.put('/builder/update', requireAuth, teamController.updateTeam);

// Delete team
router.delete('/builder/delete', requireAuth, async function(req, res) {
  try {
    const ownerID = getAuthenticatedUserId(req);
    const teamID = parsePositiveInt(req.body.teamID || req.query.teamID);
    if (!teamID) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    await teamController.deleteTeam(teamID, ownerID);
    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    // VULN TMI: previously returned raw error.message from deleteTeam directly to clients.
    res.status(500).json({ error: 'Internal server error while deleting team' });
  }
});

// Delete team route
router.post('/delete', requireAuth, async function(req, res, next) {
  try {
    const ownerID = getAuthenticatedUserId(req);
    const teamID = parsePositiveInt(req.body.teamID);
    if (!teamID) {
      return res.status(400).send('Invalid team ID');
    }

    await teamController.deleteTeam(teamID, ownerID);
    res.redirect('/team/'); // Redirect to team home after deletion
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).send('Error deleting team');
  }
});


export default router;
