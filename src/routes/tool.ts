import express, { Request, Response } from 'express';
import prisma from '../utils/prismaclient';

const router = express.Router();

router.get('/getTools', async (req: Request, res: Response) => {
  try {
    const tools = await prisma.tool.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
        authProvider: true,
        authConfig: true,
        createdAt: true,
        authRequired:true,/// npx prisma generate errror 
        // explicitly exclude accessKeys and userTools by not selecting them
      },
    });
    res.json(tools);
  } catch (error) {
    console.error('Failed to fetch tools:', error);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
});


export default router;
