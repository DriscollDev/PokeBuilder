import { Router } from 'express';
const router = Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Team Builder Page');
});

export default router;
