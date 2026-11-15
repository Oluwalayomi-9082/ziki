/**
 * Canonical Cold Outreach Template for Ziki Marketing (#marketing-cold-outreach).
 *
 * Designed for outbound campaigns for Ziki itself and other tenant projects.
 * Supports Sections A through F:
 * - Section A: Campaign overview
 * - Section B: Ideal Customer Profile (ICP)
 * - Section C: Personalization placeholders
 * - Section D: Outreach message copy (subject lines + pitch script)
 * - Section E: Follow-up drafts (suggested manual intervals)
 * - Section F: Review and verification checklist
 */

export const DEFAULT_COLD_OUTREACH_TEMPLATE = `### Section A: Campaign Overview
- **Project Name:** {{project_name}}
- **Product / Service Description:** {{product_description}}
- **Campaign Name:** [e.g. Q1 Developer Tooling Outreach]
- **Campaign Objective:** [Product awareness | Product demonstrations | Trial signups | Customer discovery | Product feedback | Partnerships]
- **Target Audience:** {{target_audience}}
- **Industry / Market:** [e.g. Developer Tools / Open Source Infrastructure]
- **Target Location:** [e.g. Global / Remote]
- **Outreach Channel:** [Email | LinkedIn | X DM | GitHub Discussion | Community]
- **Sender Identity:** {{sender_name}}
- **Campaign Status:** Draft

---

### Section B: Ideal Customer Profile (ICP)
- **Target Role / Title:** [e.g. Head of Engineering, Tech Lead, Open Source Maintainer]
- **Organization Type:** [e.g. Fast-moving tech startup, Open-source core team]
- **Industry:** [e.g. Developer Tools, Cloud Infrastructure]
- **Organization Size:** [e.g. 5–50 engineers]
- **Geographic Market:** [e.g. Global]
- **Relevant Business Problem:** {{prospect_pain_point}}
- **Why Prospect Benefits:** [e.g. Automates software development lifecycle with agentic verification]

---

### Section C: Personalization Variables
- \`{{project_name}}\` — Project name (hydrated from project)
- \`{{product_description}}\` — Product summary (hydrated from brief)
- \`{{target_audience}}\` — Target audience (hydrated from brief)
- \`{{current_focus_or_value_prop}}\` — Current focus / value prop (hydrated from brief)
- \`{{website_url}}\` — Verified site URL (hydrated from project settings)
- \`{{prospect_first_name}}\` — Prospect first name
- \`{{prospect_company}}\` — Prospect organization / repository
- \`{{prospect_role}}\` — Prospect job title
- \`{{prospect_pain_point}}\` — Specific pain point
- \`{{personalized_hook}}\` — 1 sentence referencing their recent commit, post, or release
- \`{{sender_name}}\` — Sender name / agent handle
- \`{{call_to_action}}\` — Low-friction ask

---

### Section D: Outreach Message Copy
#### Subject Line Options (Email)
1. Quick question regarding {{project_name}} & [Prospect Repo / Pain Point]
2. Loved your work on [Prospect Project] — idea for {{project_name}}
3. Automating [Pain Point] for [Prospect Company]

#### Message Script
Hi {{prospect_first_name}},

{{personalized_hook}}

I noticed your team is working on [Relevant Problem / Stack], and wanted to share how we approach this with **{{project_name}}**.

{{product_description}}

Specifically for teams like {{prospect_company}}:
- **Core Value:** {{current_focus_or_value_prop}}
- **Designed for:** {{target_audience}}
- **Product Overview:** {{website_url}}

{{call_to_action}}

Best regards,  
{{sender_name}}

---

### Section E: Follow-Up Drafts
*Suggested manual intervals (no automated scheduling or sending):*

#### Follow-up 1 (~3 Days Later — Value Add)
Hi {{prospect_first_name}}, following up on my note earlier. Thought you might find this relevant to what you're building: [Brief resource, benchmark, or demo link]. Would love your take if you have 2 minutes.

#### Follow-up 2 (~7 Days Later — Final Check-in / Breakup)
Hi {{prospect_first_name}}, I know you're busy so I won't follow up again on this. If [Relevant Problem] ever becomes a priority for {{prospect_company}}, {{project_name}} is always available at {{website_url}}. Best of luck with your releases!

---

### Section F: Review & Verification Checklist
- [ ] Prospect identity and contact handle verified
- [ ] Personalization checked (no unresolved \`{{...}}\` tags left)
- [ ] Product claims verified (accurate, no fabricated claims or guarantees)
- [ ] Message tone and length reviewed
- [ ] Appropriate outreach channel selected
- [ ] Applicable opt-out and suppression requirements checked
- [ ] Final draft approved before sending
`;

export type OutreachTemplateVariable = {
  key: string;
  label: string;
  description: string;
  source: "project" | "brief" | "prospect" | "sender";
};

export const OUTREACH_TEMPLATE_VARIABLES: readonly OutreachTemplateVariable[] = [
  { key: "project_name", label: "Project Name", description: "Name of the project", source: "project" },
  { key: "product_description", label: "Product Description", description: "Product description from ProjectBrief", source: "brief" },
  { key: "target_audience", label: "Target Audience", description: "Target audience from ProjectBrief", source: "brief" },
  { key: "current_focus_or_value_prop", label: "Core Value / Focus", description: "Current focus from ProjectBrief", source: "brief" },
  { key: "website_url", label: "Website URL", description: "Verified site URL from project settings", source: "project" },
  { key: "prospect_first_name", label: "Prospect First Name", description: "Recipient's first name", source: "prospect" },
  { key: "prospect_company", label: "Prospect Company", description: "Recipient's company or repository", source: "prospect" },
  { key: "prospect_role", label: "Prospect Role", description: "Recipient's role or title", source: "prospect" },
  { key: "prospect_pain_point", label: "Prospect Pain Point", description: "Specific pain point observed", source: "prospect" },
  { key: "personalized_hook", label: "Personalized Hook", description: "1-sentence hook referencing recipient's work", source: "prospect" },
  { key: "sender_name", label: "Sender Name", description: "Sender name or agent handle", source: "sender" },
  { key: "call_to_action", label: "Call to Action", description: "Low-friction ask (chat, feedback, test)", source: "prospect" },
] as const;

export type OutreachProjectContext = {
  projectName: string;
  siteUrl?: string | null;
  brief?: {
    product?: string | null;
    audience?: string | null;
    currentFocus?: string | null;
    current_focus?: string | null;
    outOfScope?: string | null;
    out_of_scope?: string | null;
  } | null;
  senderName?: string | null;
};

/**
 * Checks whether a task type name refers to Outreach.
 */
export function isOutreachType(typeName: string | null | undefined): boolean {
  return (typeName ?? "").trim().toLowerCase() === "outreach";
}

/**
 * Safely resolves the template for a marketing task type.
 * If the database record already has a template, returns it.
 * If it is the "Outreach" task type but has no stored template, returns the
 * canonical {@link DEFAULT_COLD_OUTREACH_TEMPLATE} as a safe application-level fallback.
 */
export function getOutreachTemplateForType(type: { name: string; template?: string | null }): string | null {
  if (type.template && type.template.trim().length > 0) {
    return type.template;
  }
  if (isOutreachType(type.name)) {
    return DEFAULT_COLD_OUTREACH_TEMPLATE;
  }
  return null;
}

/**
 * Hydrates the Cold Outreach Template with project and brief details.
 *
 * Rules:
 * - Never fabricates claims or relationships.
 * - Missing brief fields are rendered as clearly identified editable placeholders (e.g. `[Enter Target Audience]`).
 * - Never substitutes a repository URL for a product website without verification.
 * - Prospect-specific variables (e.g. `{{prospect_first_name}}`) are preserved for the author to fill in.
 */
export function hydrateOutreachTemplate(template: string, context: OutreachProjectContext): string {
  const projectName = context.projectName.trim() || "[Enter Project Name]";
  const productDescription = context.brief?.product?.trim() || "[Enter Product / Service Description]";
  const targetAudience = context.brief?.audience?.trim() || "[Enter Target Audience]";
  const currentFocus =
    context.brief?.currentFocus?.trim() ||
    context.brief?.current_focus?.trim() ||
    "[Enter Core Value Proposition / Current Focus]";
  const websiteUrl = context.siteUrl?.trim() || "[Enter Verified Website URL]";
  const senderName = context.senderName?.trim() || "[Your Name / Agent Name]";

  return template
    .replace(/\{\{project_name\}\}/g, projectName)
    .replace(/\{\{product_description\}\}/g, productDescription)
    .replace(/\{\{target_audience\}\}/g, targetAudience)
    .replace(/\{\{current_focus_or_value_prop\}\}/g, currentFocus)
    .replace(/\{\{website_url\}\}/g, websiteUrl)
    .replace(/\{\{sender_name\}\}/g, senderName);
}
