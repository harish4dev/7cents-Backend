import { Router } from 'express';
import {
  getConversations,
  createConversation,
  getConversationMessages,
  addMessageToConversation,
  updateConversation,
  deleteConversation,
} from '../controllers/conversations.controller';

const router = Router();

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id/messages', getConversationMessages);
router.post('/:id/messages', addMessageToConversation);
router.patch('/:id', updateConversation);
router.delete('/:id', deleteConversation);

export default router;