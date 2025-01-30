import { Router } from 'express';
const router = Router();

import authController from "../controllers/auth.js";


router.get('/', function(req, res, next) {
  res.render("login", { title: 'Login' });
});

router.post('/auth', authController.loginUser, (req, res, next) => {
  res.redirect("/dashboard");
});


export default router;
