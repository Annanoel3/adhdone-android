import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) {
      return Response.json({ success: false, error: 'file_url is required' }, { status: 400 });
    }

    const transcription = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
    const text = typeof transcription === 'string' ? transcription : (transcription?.text || '');

    if (!text.trim()) {
      return Response.json({ success: false, error: 'Nothing was heard — try again.' });
    }

    return Response.json({ success: true, transcription: text, text });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}