import express, { Router, Request, Response } from 'express';
import { mint_user_token, ping, status_check } from './api_controllers';

const router = express.Router();

router.get('/', status_check);
router.post('/ping', ping);
router.post('/mint_user_token', mint_user_token);

export default router;
