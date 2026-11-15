"use client";

import { useId, useState, useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { createBugAction } from "@/app/actions/issues";
import { MarkdownEditor } from "@/components/markdown-editor";
import { OutreachTemplatePreviewDialog } from "@/components/marketing/outreach-template-preview-dialog";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { initialDescription, templateSwitch } from "@/lib/issue-templates";
import {
  getOutreachTemplateForType,
  hydrateOutreachTemplate,
  isOutreachType,
} from "@/lib/marketing/templates/cold-outreach";
import type { ProjectRef } from "@/lib/project-paths";

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 5000;
const RATIONALE_MAX = 2000;

function FieldLabel({
  htmlFor,
  id,
  children,
}: {
  htmlFor: string;
  id?: string;
  children: string;
}) {
  return (
    <label
      id={id}
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-zk-text"
    >
      {children}
    </label>
  );
}

function Counter({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  return (
    <span
      className="font-mono text-xs tabular-nums text-zk-text2"
      aria-hidden="true"
    >
      {value}/{max}
    </span>
  );
}

export type MarketingTaskTypeItem = {
  id: string;
  name: string;
  template?: string | null;
  isActive?: boolean;
};

export type NewMarketingTaskFormProps = {
  projectId: string;
  project?: {
    name: string;
    siteUrl?: string | null;
  };
  slug?: ProjectRef;
  brief?: {
    product?: string | null;
    audience?: string | null;
    currentFocus?: string | null;
    current_focus?: string | null;
    outOfScope?: string | null;
    out_of_scope?: string | null;
  } | null;
  types: MarketingTaskTypeItem[];
  initialTypeId?: string;
};

/**
 * The fields a marketing proposal needs (plan M-UI-3):
 * title, description, task type and rationale.
 * There are no points, because pay comes from each
 * task's own reward (D5).
 *
 * When an Outreach task type is chosen, it
 * pre-populates with the Cold Outreach Template
 * hydrated with this project's brief and settings.
 * Existing user edits are preserved via templateSwitch.
 */
export function NewMarketingTaskForm({
  projectId,
  project,
  slug,
  brief,
  types,
  initialTypeId,
}: NewMarketingTaskFormProps) {
  const router = useRouter();
  const uid = useId();
  const confirm = useConfirm();

  function resolveTemplate(typeId: string): string | null {
    const t = types.find((item) => item.id === typeId);
    if (!t) return null;

    const raw = getOutreachTemplateForType(t);
    if (!raw) return null;

    if (project) {
      return hydrateOutreachTemplate(raw, {
        projectName: project.name,
        siteUrl: project.siteUrl,
        brief,
      });
    }

    return raw;
  }

  const defaultTypeId =
    initialTypeId && types.some((t) => t.id === initialTypeId)
      ? initialTypeId
      : types[0]?.id ?? "";

  const [selectedTypeId, setSelectedTypeId] =
    useState(defaultTypeId);

  const [title, setTitle] = useState("");
  const [rationale, setRationale] = useState("");

  const [description, setDescription] = useState(() =>
    initialDescription(resolveTemplate(defaultTypeId))
  );

  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [showOutreachPreview, setShowOutreachPreview] =
    useState(false);

  const selectedType = types.find(
    (t) => t.id === selectedTypeId
  );

  const isSelectedOutreach = isOutreachType(
    selectedType?.name
  );

  const outreachType =
    types.find((t) => isOutreachType(t.name)) ?? null;

  function handleTypeChange(nextTypeId: string) {
    const fromTemplate = resolveTemplate(selectedTypeId);
    const toTemplate = resolveTemplate(nextTypeId);

    setSelectedTypeId(nextTypeId);

    const decision = templateSwitch(
      description,
      fromTemplate,
      toTemplate
    );

    if (decision.kind === "replace") {
      setDescription(decision.text);
    } else if (decision.kind === "confirm") {
      void confirm({
        title: "Replace description with this task type's template?",
        body:
          "Your current changes in the description will be replaced by the template for this task type.",
        confirmLabel: "Use template",
        cancelLabel: "Keep my text",
      }).then((ok) => {
        if (ok) setDescription(decision.text);
      });
    }
  }

  function handleRehydrateTemplate() {
    const hydrated = resolveTemplate(selectedTypeId);
    if (!hydrated) return;

    void confirm({
      title: "Reset description to the outreach template?",
      body:
        "This will repopulate the template using the current project brief and settings. Any custom text you wrote will be replaced.",
      confirmLabel: "Reset description",
      cancelLabel: "Cancel",
    }).then((ok) => {
      if (ok) setDescription(hydrated);
    });
  }

  const ids = {
    title: `${uid}-title`,
    rationale: `${uid}-rationale`,
    rationaleHelp: `${uid}-rationale-help`,
    description: `${uid}-description`,
    descriptionLabel: `${uid}-description-label`,
    type: `${uid}-type`,
  };

  return (
    <>
      <form
        className="space-y-7 rounded-3xl border border-zk-border bg-zk-surface p-6 sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();

          const formData = new FormData(event.currentTarget);

          formData.set("track", "marketing");
          formData.set("projectId", projectId);
          formData.set("typeId", selectedTypeId);
          formData.set("description", description);

          setError("");

          startTransition(async () => {
            try {
              const result = await createBugAction(formData);

              if (result.error) {
                setError(result.error);
              }
            } catch (failure) {
              unstable_rethrow(failure);

              setError(
                "Your idea couldn't be sent. Check your connection and try again."
              );
            }
          });
        }}
      >
        <div>
          <FieldLabel htmlFor={ids.title}>
            Title
          </FieldLabel>

          <Input
            id={ids.title}
            name="title"
            required
            minLength={3}
            maxLength={TITLE_MAX}
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="e.g. Outreach campaign to open source devtool maintainers"
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm text-zk-text2">
              Be concise and focus on the expected outcome.
            </p>

            <Counter
              value={title.length}
              max={TITLE_MAX}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor={ids.type}>
              Task type
            </FieldLabel>

            {isSelectedOutreach && project ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowOutreachPreview(true)
                  }
                  className="text-xs font-semibold text-zk-accent hover:underline focus-visible:outline-2 focus-visible:outline-electric-blue"
                >
                  Preview Outreach Template
                </button>

                <span
                  className="text-zk-muted"
                  aria-hidden="true"
                >
                  ·
                </span>

                <button
                  type="button"
                  onClick={handleRehydrateTemplate}
                  className="text-xs text-zk-text2 hover:text-zk-text hover:underline focus-visible:outline-2 focus-visible:outline-electric-blue"
                >
                  Repopulate from brief
                </button>
              </div>
            ) : null}
          </div>

          {types.length > 0 ? (
            <Select
              id={ids.type}
              name="typeId"
              required
              value={selectedTypeId}
              onChange={(e) =>
                handleTypeChange(e.target.value)
              }
            >
              {types.map((type) => (
                <option
                  key={type.id}
                  value={type.id}
                >
                  {type.name}
                </option>
              ))}
            </Select>
          ) : (
            <>
              <Select
                id={ids.type}
                name="typeId"
                required
                disabled
              >
                <option value="">
                  No task types yet
                </option>
              </Select>

              <p className="mt-2 text-sm text-zk-text2">
                An organisation owner or admin can add
                task types in the marketing settings.
              </p>
            </>
          )}
        </div>

        <div>
          <FieldLabel htmlFor={ids.rationale}>
            Rationale
          </FieldLabel>

          <p
            id={ids.rationaleHelp}
            className="mb-2 text-sm text-zk-text2"
          >
            How does this serve the current focus?
          </p>

          <Textarea
            id={ids.rationale}
            name="rationale"
            required
            maxLength={RATIONALE_MAX}
            rows={4}
            value={rationale}
            onChange={(event) =>
              setRationale(event.target.value)
            }
            aria-describedby={ids.rationaleHelp}
          />

          <div className="mt-2 flex justify-end">
            <Counter
              value={rationale.length}
              max={RATIONALE_MAX}
            />
          </div>
        </div>

        <div>
          <FieldLabel
            htmlFor={ids.description}
            id={ids.descriptionLabel}
          >
            Description
          </FieldLabel>

          <MarkdownEditor
            id={ids.description}
            labelId={ids.descriptionLabel}
            name="description"
            required
            minLength={10}
            maxLength={DESCRIPTION_MAX}
            rows={14}
            allowUploads={false}
            value={description}
            onChange={setDescription}
            placeholder="What should happen, who it's for, and how to do it."
            footer={
              <Counter
                value={description.length}
                max={DESCRIPTION_MAX}
              />
            }
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="text-sm font-medium text-zk-bad-fg"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={
              types.length === 0 || isPending
            }
          >
            {isPending
              ? "Proposing…"
              : "Propose task"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="ml-auto"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>

      {project && slug && (
        <OutreachTemplatePreviewDialog
          isOpen={showOutreachPreview}
          onClose={() =>
            setShowOutreachPreview(false)
          }
          slug={slug}
          project={project}
          brief={brief}
          outreachType={
            outreachType
              ? {
                  ...outreachType,
                  isActive:
                    outreachType.isActive ?? false,
                }
              : null
          }
        />
      )}
    </>
  );
}
