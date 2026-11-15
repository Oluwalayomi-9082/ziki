import { LoadError } from "@/components/load-error";
import { NewMarketingTaskForm } from "@/components/marketing/tasks/new-marketing-task-form";
import { logLoadFailure } from "@/lib/load-error";
import { readProjectBrief } from "@/lib/marketing/brief";
import { MARKETING_TRACK } from "@/lib/marketing/track";
import { prisma } from "@/lib/prisma";
import { projectRef } from "@/lib/project-paths";
import { requireProject } from "@/lib/project-route";

export const metadata = { title: "Propose a marketing task" };

/** `/<slug>/marketing/tasks/new`: the form for proposing a marketing task (M-UI-3). */
export default async function NewMarketingTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string; project: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { org, project: projectSlug } = await params;
  const { organisationId, project } = await requireProject(org, projectSlug);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawTypeId = resolvedSearchParams?.typeId;
  const initialTypeId = Array.isArray(rawTypeId) ? rawTypeId[0] : rawTypeId;

  let types;
  let brief;
  try {
    [types, brief] = await Promise.all([
      prisma.issueType.findMany({
        where: { organisationId, ...MARKETING_TRACK, isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, template: true },
      }),
      readProjectBrief(project.id),
    ]);
  } catch (error) {
    return (
      <LoadError
        title="The marketing task form could not be loaded"
        reference={logLoadFailure("[marketing task form] task types read failed", error)}
      />
    );
  }

  const slug = projectRef(org, projectSlug);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <header className="space-y-2">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-zk-text">
          Propose a marketing task
        </h1>
      </header>
      <NewMarketingTaskForm
        projectId={project.id}
        project={{ name: project.name, siteUrl: brief?.website ?? null }}
        slug={slug}
        brief={brief}
        types={types}
        initialTypeId={initialTypeId}
      />
    </div>
  );
}
