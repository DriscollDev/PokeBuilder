import { Router } from 'express';

const router = Router();

import authController from "../controllers/auth.js";
import passport from "passport";


router.get('/login', function(req, res, next) {
  res.render("login", { title: 'Login' });
});

router.get('/register', function(req, res, next) {
  res.render("signup", { title: 'Sign Up' });
});

router.post('/login', authController.loginUser, passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login' }));

router.post('/register', authController.registerUser, passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/register'
  }));

router.post('/logout', function(req, res, next) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

export default router;




