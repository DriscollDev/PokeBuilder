import { Router } from 'express';
const router = Router();

import authController from "../controllers/auth.js";


router.get('/', function(req, res, next) {
  res.render("signup", { title: 'Sign Up' });
});
router.post('/auth', authController.registerUser);



export default router;
