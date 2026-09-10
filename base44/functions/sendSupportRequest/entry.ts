import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Sends a user's question / app frustration to the app owner's inbox, but ONLY
// after the user explicitly agreed in Support Space (privacy: nothing from a
// conversation leaves the app without a yes).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { message, transcript } = await req.json();
    if (!message || !message.trim()) {
      return Response.json({ error: 'Nothing to send' }, { status: 400 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'mediocreatbestdev@outlook.com',
      from_name: 'ADHDone Support Requests',
      subject: `ADHDone support request from ${user.full_name || user.email}`,
      body: `A user asked to send this to customer support from Support Space.

From: ${user.full_name || 'Unknown'} (${user.email})
Time: ${new Date().toISOString()}

Their message:
"${message}"

${transcript ? `Conversation context (shared with their permission):\n${String(transcript).slice(0, 4000)}` : '(No conversation context shared.)'}`,
    });

    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}