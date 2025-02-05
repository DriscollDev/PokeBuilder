import { Router } from 'express';
import passport from 'passport';
const router = Router();


router.get('/',passport.authenticate('session'), function(req, res, next) {
  //req.session.regenerate((err) => {
    //if (err) next(err);
    res.render("dashboard", { title: 'Dashboard' });
  //});
})

router.get('/help', function(req, res, next) {
  res.render("help", { title: 'Help' });
})

router.get('/build', function(req, res, next) {
  res.render("teambuilding", { title: 'Team Building Help' });
})


router.get('/user', function(req, res, next) {
  res.render("account", { title: 'Account Info' });
})



router.get('/team:teamid', function(req, res, next) {
  res.render("team", { title: 'Team View', team: req.params.teamid });
})

router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
})

router


export default router;
