import express, { Request, Response } from 'express';
import prisma from '../utils/prismaclient';

const router = express.Router();

router.post('/createOrUpdate', async (req:Request, res:any) => {
  const { email, name } = req.body;

  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    });
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to upsert user' });
  }
});

// backend/routes/userTool.ts
router.post('/registerTools', async (req: Request, res: any) => {
    const { userId, toolIds } = req.body;
  
    if (!userId || !Array.isArray(toolIds)) {
      return res.status(400).json({ error: 'Missing or invalid data' });
    }
  
    try {
      const results = await Promise.all(
        toolIds.map(async (toolId: string) => {
          const existing = await prisma.userTool.findUnique({
            where: {
              userTool_userId_toolId: {
                userId: userId,
                toolId: toolId
              }
            }
          })
  
          if (existing) return existing;
  
          return await prisma.userTool.create({
            data: { userId, toolId },
          });
        })
      );
  
      return res.status(200).json({ success: true, tools: results });
    } catch (error) {
      console.error('Error registering tools:', error);
      return res.status(500).json({ error: 'Failed to register tools' });
    }
  });

  router.get('/userTools', async (req: Request, res: any) => {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userId' });
    }
    
    try {
      // Get all tools
      const userOwnedTools = await prisma.tool.findMany({
        where: {
          userTools: {
            some: {
              userId: userId
            }
          }
        },
        include: {
          userTools: {
            where: { userId: userId }
          }
        }
      });
      // Transform the data to include authorization status
    
      
      res.status(200).json(userOwnedTools);
    } catch (error) {
      console.error('Failed to fetch user tools:', error);
      res.status(500).json({ error: 'Failed to fetch user tools' });
    }
  });
  
  

export default router;
