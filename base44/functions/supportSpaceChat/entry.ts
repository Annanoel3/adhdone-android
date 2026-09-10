import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import OpenAI from "npm:openai";
import { secrets, waitUntil } from "base44:runtime";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, userMessage } = await req.json();
    const openai = new OpenAI({ apiKey: secrets.get('OPENAI_API_KEY') });

    const sourcingRules = `

RESEARCH & SOURCING REQUIREMENT:
Any claim you make about ADHD, executive function, attention, motivation, sleep, medication effects, or behavior-change strategy MUST be backed by a real source you actually found with the web_search tool. Search before you answer whenever the answer contains such a claim.
- Prefer peer-reviewed research, systematic reviews/meta-analyses, and official clinical guidance (CHADD, NIMH, CDC, AAP, NICE).
- End the message with a "Sources" list: author/organization, year, title, and the URL you actually retrieved.
- If a search turns up nothing solid, say plainly that there isn't good evidence for it and label the suggestion as untested practical advice — never invent a citation, journal, author, DOI, or URL.
- Questions about how the ADHDone app itself works are answered from the app reference in this prompt and need NO sources.

APP TROUBLESHOOTING STYLE:
When something in the app isn't working (a notification missing, a feature not showing, something that "was working before"), do NOT dump a list of possible causes. Give ONE most-likely fix, in a sentence or two, then ask if it worked.
- If it was working before and stopped, the first suggestion is almost always: fully close the app (swipe it away) and reopen it.
- Only if the user comes back and says that didn't help do you move on to the next most likely cause (permissions, the relevant setting, toggling the feature off/on, restarting the phone) — again one at a time.`;

    const response = await openai.responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search" }],
      input: prompt + sourcingRules
    });

    const message = response.output_text;

    // Acceptable-use monitoring: flag only genuinely severe content (OpenAI
    // moderation), then alert the app owner by email. Runs after the response
    // so it never slows down or breaks the chat.
    if (userMessage) {
      waitUntil((async () => {
        try {
          const mod = await openai.moderations.create({
            model: 'omni-moderation-latest',
            input: userMessage
          });
          const result = mod.results?.[0];
          if (!result?.flagged) return;

          const scores = result.category_scores || {};
          const triggered = Object.keys(result.categories || {})
            .filter((c) => result.categories[c] && (scores[c] ?? 0) >= 0.5);
          if (triggered.length === 0) return;

          const details = triggered
            .map((c) => `${c} (${((scores[c] ?? 0) * 100).toFixed(1)}%)`)
            .join(', ');

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: 'mediocreatbestdev@outlook.com',
            from_name: 'ADHDone Safety Alerts',
            subject: `ADHDone: acceptable-use flag (${triggered[0]})`,
            body: `A Support Space message crossed the acceptable-use threshold.

User: ${user.full_name || 'Unknown'} (${user.email})
Time: ${new Date().toISOString()}
Flagged categories: ${details}

Message:
"${userMessage}"

Assistant reply:
"${(message || '').slice(0, 1500)}"`
          });
        } catch (e) {
          console.error('Acceptable-use alert failed:', e.message);
        }
      })());
    }

    return Response.json({ message });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}