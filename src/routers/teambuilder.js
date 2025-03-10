import { Router } from 'express';
const router = Router();

// Import the team controller
import teamController from '../controllers/teamController.js';

// Get teams by user ID
router.get('/', function (req, res, next) {
  const teams = teamController.getTeamsByUser;
  res.render("teamhome", {
    title: 'Team View',
    teams: teams
  });
});



// Team Builder Page - Now fetches team data before rendering
router.post('/builder', async function(req, res, next) {
  try {
    const team = await teamController.getTeamById(req.body.teamID);
    res.render("teambuilder", { 
      title: 'Team Builder',
      team: team
    });
  } catch (error) {
    console.error('Error loading team:', error);
    res.status(500).send('Error loading team');
  }
});

// Create team
router.post('/builder/create', teamController.createTeam);

// Update team
router.put('/builder/update', teamController.updateTeam);

// Delete team
router.delete('/builder/delete', teamController.deleteTeam);

// Delete team route
router.post('/delete', async function(req, res, next) {
  try {
    await teamController.deleteTeam(req.body.teamID);
    res.redirect('/team/'); // Redirect to team home after deletion
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).send('Error deleting team');
  }
});


export default router;
