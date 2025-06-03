// backend/routes/auth.ts
import express, { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../utils/prismaclient';
 // Adjust path if needed
const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = 'http://localhost:3333/api/auth/google/callback';

router.get('/tokens', async (req: Request, res: any) => {
  const { toolId, userId } = req.query;

  if (!toolId || !userId) {
    return res.status(400).json({ error: 'Missing toolId or userId' });
  }

  switch (toolId) {
    case 'GMAIL_SENDER':
      const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.send');
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${userId},${toolId}`;
      return res.redirect(oauthUrl);

    default:
      return res.status(400).json({ error: 'Unsupported toolId' });
  }
});

// backend/routes/auth.ts (continued)
router.get('/google/callback', async (req: Request, res: any) => {
    const { code, state } = req.query;
  
    if (!code || !state) return res.status(400).json({ error: 'Missing code or state' });
  
    const [userId, toolId] = (state as string).split(',');
  
    try {
      // Exchange code for tokens
      const tokenRes = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        },
      });
  
      const { access_token, refresh_token, expires_in } = tokenRes.data;
  
      await prisma.accessKey.upsert({
        where: {
          userId_toolId: {
            userId,
            toolId,
          },
        },
        update: {
          accessToken: access_token,
          refreshToken: refresh_token,
        },
        create: {
          userId,
          toolId,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // example expiry 30 days
        },
      });

      await prisma.userTool.update({
        where: {
          userTool_userId_toolId: {
            userId: userId,
            toolId: toolId
          }
        },
        data:{
            authorized:true
        }
      })

  
      return res.redirect('http://localhost:3000/dashboard');   
     } catch (err) {
      console.error('OAuth callback error:', err);
      return res.status(500).send('OAuth failed.');
    }
  });
  
  export default router;
  