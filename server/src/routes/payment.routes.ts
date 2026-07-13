import { Router } from 'express';

const router = Router();

router.get('/success', (_req, res) => {
  res.redirect('mapsinteractive://business/success');
});

router.get('/failure', (_req, res) => {
  res.redirect('mapsinteractive://business/failure');
});

router.get('/pending', (_req, res) => {
  res.redirect('mapsinteractive://business/pending');
});

export default router;
