import express, { Router } from 'express';
import api_routes from './api_routes';

const router = express.Router();

router.use('/api', api_routes);

export default router;
