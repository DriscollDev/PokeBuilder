import { Router } from 'express';
import passport from 'passport';
import teamController from '../controllers/teamController.js';
const router = Router();


router.get('/',passport.authenticate('session'), async function(req, res, next) {
  //req.session.regenerate((err) => {
    //if (err) next(err);
    const teams = await teamController.getTeamsByCurrentUser(req);
    res.render("dashboard", { 
      title: 'Dashboard',
      teams: teams

    });
  //});
})

router.get('/help', function(req, res, next) {
  res.render("help", { title: 'Help' });
})

router.get('/build', function(req, res, next) {
  res.render("teambuilding", { title: 'Team Building Help' });
})


router.get('/user', function(req, res, next) {
  res.render("account", { title: 'Account Info' , user: req.user});
  });



router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
})

router


export default router;
