import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import OpenAI from "npm:openai";
import { secrets } from "base44:runtime";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt } = await req.json();
    const openai = new OpenAI({ apiKey: secrets.get('OPENAI_API_KEY') });

    const sourcingRules = `

RESEARCH & SOURCING REQUIREMENT:
Any claim you make about ADHD, executive function, attention, motivation, sleep, medication effects, or behavior-change strategy MUST be backed by a real source you actually found with the web_search tool. Search before you answer whenever the answer contains such a claim.
- Prefer peer-reviewed research, systematic reviews/meta-analyses, and official clinical guidance (CHADD, NIMH, CDC, AAP, NICE).
- End the message with a "Sources" list: author/organization, year, title, and the URL you actually retrieved.
- If a search turns up nothing solid, say plainly that there isn't good evidence for it and label the suggestion as untested practical advice — never invent a citation, journal, author, DOI, or URL.
- Questions about how the ADHDone app itself works are answered from the app reference in this prompt and need NO sources.`;

    const response = await openai.responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search" }],
      input: prompt + sourcingRules
    });

    const message = response.output_text;
    return Response.json({ message });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}