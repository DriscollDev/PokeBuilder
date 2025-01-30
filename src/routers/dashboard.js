import { Router } from 'express';
import passport from 'passport';
const router = Router();


router.get('/',passport.authenticate('session'), function(req, res, next) {
  req.session.regenerate((err) => {
    if (err) next(err);
    res.render("dashboard", { title: 'Dashboard' });
  });
})



export default router;
