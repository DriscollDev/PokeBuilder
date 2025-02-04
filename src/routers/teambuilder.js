import { Router } from 'express';
const router = Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render("teamhome", { title: 'Team View' });

});
router.get('/builder', function(req, res, next) {
  res.render("teambuilder", { title: 'Builder View' });

});

export default router;
