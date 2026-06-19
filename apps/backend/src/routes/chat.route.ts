import { Router, Request, Response } from 'express';
import { handleChat, toolResultEmitter } from '../controllers/chat.controller';

const router = Router();

router.post('/', handleChat);

// Endpoint for the extension to post back tool execution results
router.post('/result/:callId', (req: Request, res: Response) => {
  const { callId } = req.params;
  const result = req.body;
  
  toolResultEmitter.emit(callId, result);
  res.json({ success: true });
});

export default router;
