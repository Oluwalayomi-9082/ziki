"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_COLD_OUTREACH_TEMPLATE,
  getOutreachTemplateForType,
  hydrateOutreachTemplate,
  OUTREACH_TEMPLATE_VARIABLES,
  type OutreachProjectContext,
} from "@/lib/marketing/templates/cold-outreach";
import { marketingPath, type ProjectRef } from "@/lib/project-paths";

export type OutreachPreviewProps = {
  isOpen: boolean;
  onClose: () => void;
  slug: ProjectRef;
  project: {
    name: string;
    siteUrl?: string | null;
  };
  brief?: {
    product?: string | null;
    audience?: string | null;
    currentFocus?: string | null;
    outOfScope?: string | null;
  } | null;
  outreachType?: {
    id: string;
    name: string;
    isActive: boolean;
    template?: string | null;
  } | null;
};

export function OutreachTemplateTrigger({
  slug,
  project,
  brief,
  outreachType,
}: {
  slug: ProjectRef;
  project: { name: string; siteUrl?: string | null };
  brief?: OutreachProjectContext["brief"];
  outreachType?: { id: string; name: string; isActive: boolean; template?: string | null } | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-zk-border bg-zk-surface px-3 py-1 text-xs font-semibold text-zk-text hover:bg-zk-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-blue"
      >
        <svg
          className="h-3.5 w-3.5 text-zk-accent"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        Outreach template
      </button>
      <OutreachTemplatePreviewDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        slug={slug}
        project={project}
        brief={brief}
        outreachType={outreachType}
      />
    </>
  );
}

export function OutreachTemplatePreviewDialog({
  isOpen,
  onClose,
  slug,
  project,
  brief,
  outreachType,
}: OutreachPreviewProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "variables">("preview");

  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  const context: OutreachProjectContext = {
    projectName: project.name,
    siteUrl: project.siteUrl,
    brief,
  };

  const template = outreachType
    ? getOutreachTemplateForType(outreachType) ?? DEFAULT_COLD_OUTREACH_TEMPLATE
    : DEFAULT_COLD_OUTREACH_TEMPLATE;
  const hydratedTemplate = hydrateOutreachTemplate(template, context);
  const hasBriefData = Boolean(brief?.product || brief?.audience || brief?.currentFocus);
  const canStartCampaign = Boolean(outreachType && outreachType.isActive);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(hydratedTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is blocked
    }
  }

  function handleStartCampaign() {
    if (!canStartCampaign || !outreachType) return;
    onClose();
    router.push(`${marketingPath(slug, "tasks/new")}?typeId=${encodeURIComponent(outreachType.id)}`);
  }

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto flex max-h-[90vh] w-[min(54rem,calc(100vw-2rem))] flex-col rounded-3xl border border-zk-border bg-zk-surface p-0 text-zk-text shadow-2xl backdrop:bg-black/60"
    >
      {/* Header */}
      <header className="flex shrink-0 items-start justify-between border-b border-zk-border px-6 py-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={titleId} className="text-xl font-bold tracking-tight text-zk-text">
              Cold Outreach Template
            </h2>
            <Badge className="bg-zk-chip text-zk-text">
              {project.name}
            </Badge>
            {hasBriefData ? (
              <Badge className="bg-zk-ok-bg text-zk-ok-fg">Brief connected</Badge>
            ) : (
              <Badge className="bg-zk-chip text-zk-muted">No brief — placeholders shown</Badge>
            )}
          </div>
          <p id={descId} className="text-sm text-zk-text2">
            Reusable multi-part outreach campaign structure tailored for {project.name}.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="rounded-full p-1.5 text-zk-text2 hover:bg-zk-chip hover:text-zk-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-blue"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      {/* Tabs */}
      <div className="flex shrink-0 gap-2 border-b border-zk-border px-6 pt-3">
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`border-b-2 px-3 pb-2 text-sm font-semibold transition ${
            activeTab === "preview"
              ? "border-zk-accent text-zk-accent"
              : "border-transparent text-zk-text2 hover:text-zk-text"
          }`}
        >
          Template Preview (Sections A–F)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("variables")}
          className={`border-b-2 px-3 pb-2 text-sm font-semibold transition ${
            activeTab === "variables"
              ? "border-zk-accent text-zk-accent"
              : "border-transparent text-zk-text2 hover:text-zk-text"
          }`}
        >
          Variables ({OUTREACH_TEMPLATE_VARIABLES.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "preview" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zk-text2">
              <span>Hydrated with available project settings and brief information:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="font-semibold text-zk-accent hover:underline"
              >
                {copied ? "Copied to clipboard!" : "Copy Markdown"}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-zk-border bg-zk-canvas p-4 font-mono text-xs leading-relaxed text-zk-text">
              {hydratedTemplate}
            </pre>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zk-text2">
              Placeholders used to adapt the template across campaigns and prospects:
            </p>
            <div className="overflow-hidden rounded-xl border border-zk-border">
              <table className="min-w-full divide-y divide-zk-border text-left text-xs">
                <thead className="bg-zk-chip text-zk-text">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">Placeholder</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Source</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Resolved Value for {project.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zk-border">
                  {OUTREACH_TEMPLATE_VARIABLES.map((v) => {
                    let resolved = "";
                    if (v.key === "project_name") resolved = project.name;
                    else if (v.key === "product_description") resolved = brief?.product || "—";
                    else if (v.key === "target_audience") resolved = brief?.audience || "—";
                    else if (v.key === "current_focus_or_value_prop") resolved = brief?.currentFocus || "—";
                    else if (v.key === "website_url") resolved = project.siteUrl || "—";
                    else resolved = "(Filled per prospect)";

                    return (
                      <tr key={v.key} className="hover:bg-zk-chip/50">
                        <td className="px-3 py-2 font-mono text-zk-accent">
                          {`{{${v.key}}}`}
                        </td>
                        <td className="px-3 py-2 capitalize text-zk-text2">{v.source}</td>
                        <td className="max-w-xs truncate px-3 py-2 text-zk-text">{resolved}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zk-border bg-zk-canvas/50 px-6 py-4">
        <div>
          {!canStartCampaign ? (
            <p className="text-xs text-zk-bad-fg">
              The Outreach task type is not active in this organisation. An admin can enable it in Marketing Settings.
            </p>
          ) : (
            <p className="text-xs text-zk-text2">
              Starting a campaign pre-fills the proposal description with this template.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            disabled={!canStartCampaign}
            onClick={handleStartCampaign}
            className="bg-electric-blue-strong text-white hover:opacity-90"
          >
            Start Outreach Campaign
          </Button>
        </div>
      </footer>
    </dialog>
  );
}
