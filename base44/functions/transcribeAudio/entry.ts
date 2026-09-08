import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, audio_base64, filename } = await req.json();

    // Accepts either an already-uploaded audio URL or raw base64 audio (older
    // callers) — base64 is uploaded here so both paths reach transcription.
    let audioUrl = file_url;
    if (!audioUrl && audio_base64) {
      const bytes = Uint8Array.from(atob(audio_base64), (c) => c.charCodeAt(0));
      const file = new File([bytes], filename || 'recording.webm', { type: 'audio/webm' });
      const upload = await base44.integrations.Core.UploadFile({ file });
      audioUrl = upload?.file_url;
    }
    if (!audioUrl) {
      return Response.json({ success: false, error: 'file_url or audio_base64 is required' }, { status: 400 });
    }

    const transcription = await base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
    const text = typeof transcription === 'string' ? transcription : (transcription?.text || '');

    if (!text.trim()) {
      return Response.json({ success: false, error: 'Nothing was heard — try again.' });
    }

    return Response.json({ success: true, transcription: text, text });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}