import { Router } from 'express';
import passport from 'passport';
import teamController from '../controllers/teamController.js';
import userController from '../controllers/userController.js';
const router = Router();


router.get('/',passport.authenticate('session'), async function(req, res, next) {
  //req.session.regenerate((err) => {
    //if (err) next(err);
    const teams = await teamController.getTeamsByCurrentUser(req);
    const badges = teamController.checkBadges(teams)
    res.render("dashboard", { 
      title: 'Dashboard',
      teams: teams,
      badges: badges

    });
  //});
})

router.get('/help', function(req, res, next) {
  res.render("help", { title: 'Help' });
})

router.get('/build', function(req, res, next) {
  res.render("teambuilding", { title: 'Team Building Help' });
})


router.get('/user',async function(req, res, next) {
  const userData = await userController.getUserData(req);
  res.render("account", { title: 'Account Info' , user: userData});
  });



router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
})

router


export default router;
