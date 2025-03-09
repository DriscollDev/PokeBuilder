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

//Team Builder Page
router.get('/builder', function (req, res, next) {
  res.render("teambuilder", {
    title: 'Team Builder',
    team: null // or provide a default value
  });
});

// Create team
router.post('/builder/create', teamController.createTeam);

// Update team
router.put('/builder/update/:teamID', teamController.updateTeam);

// Delete team
router.delete('/builder/delete/:teamID', teamController.deleteTeam);

export default router;
