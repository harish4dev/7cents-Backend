// backend/routes/auth.ts
import express, { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../utils/prismaclient'; // Adjust path if needed

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
      const gmailScope = encodeURIComponent('https://www.googleapis.com/auth/gmail.send');
      const gmailOauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&response_type=code&scope=${gmailScope}&access_type=offline&prompt=consent&state=${userId},${toolId}`;
      return res.redirect(gmailOauthUrl);

    case 'CALENDAR_EVENT_CREATOR':
      // Calendar requires both calendar and calendar.events scopes
      const calendarScopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];
      const calendarScope = encodeURIComponent(calendarScopes.join(' '));
      const calendarOauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&response_type=code&scope=${calendarScope}&access_type=offline&prompt=consent&state=${userId},${toolId}`;
      return res.redirect(calendarOauthUrl);

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

    // Store tokens in database
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

    // Update user tool authorization status
    await prisma.userTool.update({
      where: {
        userTool_userId_toolId: {
          userId: userId,
          toolId: toolId
        }
      },
      data: {
        authorized: true
      }
    });

    // Provide user-friendly success message based on tool type
    let successMessage = '';
    switch (toolId) {
      case 'GMAIL_SENDER':
        successMessage = 'Gmail successfully authorized! You can now send emails.';
        break;
      case 'CALENDAR_EVENT_CREATOR':
        successMessage = 'Google Calendar successfully authorized! You can now create calendar events.';
        break;
      default:
        successMessage = 'Tool successfully authorized!';
    }

    // Redirect with success message (you can modify this based on your frontend needs)
    return res.redirect(`http://localhost:3000/dashboard?auth=success&tool=${toolId}&message=${encodeURIComponent(successMessage)}`);

  } catch (err) {
    console.error('OAuth callback error:', err);
    
    // Provide more detailed error information
    let errorMessage = 'OAuth authentication failed.';
    if (axios.isAxiosError(err) && err.response) {
      console.error('OAuth API Error:', err.response.data);
      errorMessage = `OAuth failed: ${err.response.data.error_description || err.response.data.error || 'Unknown error'}`;
    }
    
    return res.redirect(`http://localhost:3000/dashboard?auth=error&message=${encodeURIComponent(errorMessage)}`);
  }
});

export default router;