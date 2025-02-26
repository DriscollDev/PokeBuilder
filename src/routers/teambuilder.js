import { Router } from 'express';
const router = Router();

// Import the team controller
import teamController from '../controllers/teamController.js';

// Get teams by user ID
router.get('/', async function(req, res, next) {
  try{
  const teams = await teamController.getTeamsByCurrentUser(req);
  res.render("teamhome", { 
    title: 'Team View',
    teams: teams
  });
  } catch (error) {
  console.log('Error fetching teams:', error);
  throw error;
  }
});

//Team Builder Page
router.get('/builder/:team', function(req, res, next) {
  res.render("teambuilder", { 
    title: 'Team Builder',
    team: req.params.team
  });

});
// Create team
router.post('/builder/create', teamController.createTeam);


// Update team
router.put('/builder/update/:teamID', teamController.updateTeam);

// Delete team
router.delete('/builder/delete/:teamID', teamController.deleteTeam);

export default router;
