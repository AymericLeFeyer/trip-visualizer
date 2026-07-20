import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createTrip, deleteTrip, getTrip, listTrips, updateTrip } from './repository.ts';
import { buildDefaultTrip } from './defaultTrip.ts';
import type { TripInput } from '../shared/types/trip.ts';

const app = express();
const PORT = Number(process.env.PORT ?? 42069);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const api = express.Router();

api.get('/trips', (_req, res) => {
  res.json(listTrips());
});

api.post('/trips', (req, res) => {
  const input = (req.body && Object.keys(req.body).length > 0
    ? req.body
    : buildDefaultTrip()) as TripInput;
  const trip = createTrip(input);
  res.status(201).json(trip);
});

api.get('/trips/:id', (req, res) => {
  const trip = getTrip(req.params.id);
  if (!trip) {
    res.status(404).json({ error: 'Voyage introuvable' });
    return;
  }
  res.json(trip);
});

api.put('/trips/:id', (req, res) => {
  const trip = updateTrip(req.params.id, req.body as TripInput);
  if (!trip) {
    res.status(404).json({ error: 'Voyage introuvable' });
    return;
  }
  res.json(trip);
});

api.delete('/trips/:id', (req, res) => {
  const ok = deleteTrip(req.params.id);
  res.status(ok ? 204 : 404).end();
});

app.use('/api', api);

// En production, on sert le frontend buildé et on laisse le routeur SPA gérer les routes.
if (process.env.NODE_ENV === 'production') {
  const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
  if (existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(resolve(distDir, 'index.html'));
    });
  }
}

app.listen(PORT, () => {
  console.log(`🗺️  Trip Visualizer API sur http://localhost:${PORT}`);
});
