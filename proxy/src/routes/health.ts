import { Router } from 'express';

export const router = Router();

router.post('/', (_req, res) => {
  res.json({ ok: true });
});


