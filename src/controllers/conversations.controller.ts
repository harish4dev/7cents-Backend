import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/conversations - Get all conversations for a user
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          select: { id: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const conversationsWithMessageCount = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastLLM: conv.lastLLM,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      messageCount: conv.messages.length,
    }));

    res.json(conversationsWithMessageCount);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/conversations - Create a new conversation
export const createConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, title, lastLLM, messages } = req.body;

    if (!userId || !title) {
      res.status(400).json({ error: 'User ID and title are required' });
      return;
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title,
        lastLLM: lastLLM || 'gemini',
        messages: {
          create: messages?.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            llmProvider: msg.llmProvider,
            toolResults: msg.toolResults,
          })) || [],
        },
      },
      include: {
        messages: true,
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/conversations/:id/messages - Get messages for a specific conversation
export const getConversationMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        lastLLM: conversation.lastLLM,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        llmProvider: msg.llmProvider,
        toolResults: msg.toolResults,
        createdAt: msg.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/conversations/:id/messages - Add a message to a conversation
export const addMessageToConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, content, llmProvider, toolResults } = req.body;

    if (!role || !content) {
      res.status(400).json({ error: 'Role and content are required' });
      return;
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        role,
        content,
        llmProvider,
        toolResults,
      },
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error adding message to conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/conversations/:id - Update a conversation (title, lastLLM)
export const updateConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, lastLLM } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (lastLLM !== undefined) updateData.lastLLM = lastLLM;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
    });

    res.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    if ((error as any).code === 'P2025') {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/conversations/:id - Delete a conversation
export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.conversation.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting conversation:', error);
    if ((error as any).code === 'P2025') {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};