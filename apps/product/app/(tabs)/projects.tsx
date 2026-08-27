import { api } from "@launch/convex/_generated/api";
import type { Id } from "@launch/convex/_generated/dataModel";
import { AppScreen, PrimaryButton, SectionCard } from "@launch/ui-native";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useDeferredValue, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { FileRow } from "@/components/file-row";
import { ProjectRow } from "@/components/project-row";
import { ScreenBoundary } from "@/components/screen-boundary";
import { EmptyText, ErrorText, LoadingCard } from "@/components/status-blocks";
import { TargetFileRow } from "@/components/target-file-row";
import { UploadRow } from "@/components/upload-row";
import { useAppMode } from "@/lib/app-mode";
import { getErrorMessage } from "@/lib/errors";
import { formatFileSize } from "@/lib/file-helpers";
import {
  type PickedLaunchFile,
  pickDocumentUpload,
  pickImageUpload,
} from "@/lib/file-picker";
import {
  referenceArtifactExports,
  referenceProjectFiles,
  referenceProjects,
} from "@/lib/reference-data";
import { useFileUpload } from "@/lib/use-file-upload";
import { useLiveQueriesEnabled } from "@/lib/use-live-enabled";

type ProjectDoc = FunctionReturnType<typeof api.projects.listProjects>[number];

const inputClassName =
  "rounded-[18px] border border-[#16202a]/10 bg-white px-4 py-3 text-base text-[#16202a]";

function CreateProjectForm({
  onCreated,
}: {
  onCreated: (projectId: Id<"projects">) => void;
}) {
  const createProject = useMutation(api.projects.createProject);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const name = title.trim();
    if (name.length === 0 || pending) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const projectId = await createProject({
        summary: summary.trim().length > 0 ? summary.trim() : undefined,
        title: name,
      });
      setTitle("");
      setSummary("");
      onCreated(projectId);
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setPending(false);
    }
  };

  return (
    <View className="gap-3">
      <TextInput
        className={inputClassName}
        editable={!pending}
        onChangeText={setTitle}
        placeholder="Project title"
        placeholderTextColor="#7b838e"
        value={title}
      />
      <TextInput
        className={inputClassName}
        editable={!pending}
        onChangeText={setSummary}
        placeholder="One-line summary (optional)"
        placeholderTextColor="#7b838e"
        value={summary}
      />
      <PrimaryButton
        label={pending ? "Creating…" : "Create project"}
        onPress={() => void submit()}
      />
      <ErrorText message={error} />
    </View>
  );
}

function ProjectAttachments({ projectId }: { projectId: Id<"projects"> }) {
  const enabled = useLiveQueriesEnabled();
  const files = useQuery(
    api.storage.listForTarget,
    enabled ? { targetId: projectId, targetType: "project" } : "skip",
  );
  const { removeUpload, uploadFile, uploads } = useFileUpload();
  const [attachError, setAttachError] = useState<string | null>(null);

  const attach = async (picker: () => Promise<PickedLaunchFile | null>) => {
    setAttachError(null);
    try {
      const picked = await picker();
      if (picked === null) {
        return;
      }
      await uploadFile(picked, {
        purpose: "project_attachment",
        targetId: projectId,
        targetType: "project",
      });
    } catch (error) {
      setAttachError(getErrorMessage(error));
    }
  };

  const inFlightUploads = uploads.filter((upload) => upload.status !== "ready");

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-3">
        <PrimaryButton
          label="Attach document"
          onPress={() => void attach(pickDocumentUpload)}
        />
        <PrimaryButton
          label="Attach image"
          onPress={() => void attach(pickImageUpload)}
        />
      </View>
      <ErrorText message={attachError} />
      {inFlightUploads.map((upload) => (
        <UploadRow key={upload.key} onRemove={removeUpload} upload={upload} />
      ))}
      {files === undefined ? (
        <EmptyText message="Loading files…" />
      ) : files.length === 0 && inFlightUploads.length === 0 ? (
        <EmptyText message="No files yet — attach briefs, exports, or source material." />
      ) : (
        files.map((file) => <TargetFileRow file={file} key={file._id} />)
      )}
    </View>
  );
}

function LiveProjects() {
  const enabled = useLiveQueriesEnabled();
  const projects = useQuery(api.projects.listProjects, enabled ? {} : "skip");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<Id<"projects"> | null>(null);
  const deferredQuery = useDeferredValue(query);

  if (projects === undefined) {
    return <LoadingCard title="Projects" />;
  }

  const filtered = projects.filter((project: ProjectDoc) => {
    const needle = deferredQuery.trim().toLowerCase();
    if (needle.length === 0) {
      return true;
    }
    return `${project.name} ${project.summary} ${project.tags.join(" ")}`
      .toLowerCase()
      .includes(needle);
  });

  const selectedProject =
    selectedId === null
      ? null
      : (projects.find((project) => project._id === selectedId) ?? null);

  return (
    <>
      <SectionCard eyebrow="Projects" title="Track shipping work and approvals">
        <TextInput
          className={inputClassName}
          onChangeText={setQuery}
          placeholder="Filter projects by name, summary, or tag"
          placeholderTextColor="#7b838e"
          value={query}
        />
        {filtered.length === 0 ? (
          <EmptyText
            message={
              projects.length === 0
                ? "No projects yet — create your first one below."
                : "No projects match this filter."
            }
          />
        ) : (
          <View className="gap-3">
            {filtered.map((project) => (
              <Pressable
                key={project._id}
                onPress={() =>
                  setSelectedId((current) =>
                    current === project._id ? null : project._id,
                  )
                }
              >
                <View
                  className={
                    selectedId === project._id
                      ? "rounded-[22px] border-2 border-[#ff6b35]"
                      : "rounded-[22px] border-2 border-transparent"
                  }
                >
                  <ProjectRow
                    name={project.name}
                    progress={project.progressPercent}
                    status={
                      project.progressPercent >= 100 ? "Ready to QA" : "Active"
                    }
                    summary={
                      project.summary.length > 0
                        ? project.summary
                        : "No summary yet."
                    }
                  />
                </View>
              </Pressable>
            ))}
          </View>
        )}
        <CreateProjectForm
          onCreated={(projectId) => setSelectedId(projectId)}
        />
      </SectionCard>

      <SectionCard
        eyebrow="Files"
        title={
          selectedProject === null
            ? "Project attachments"
            : `Files · ${selectedProject.name}`
        }
      >
        {selectedProject === null ? (
          <EmptyText message="Tap a project above to attach and open its files." />
        ) : (
          <ProjectAttachments
            key={selectedProject._id}
            projectId={selectedProject._id}
          />
        )}
      </SectionCard>
    </>
  );
}

function OfflineProjects() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const projects = referenceProjects.filter((project) => {
    if (deferredQuery.trim().length === 0) {
      return true;
    }

    const haystack =
      `${project.name} ${project.summary} ${project.status}`.toLowerCase();
    return haystack.includes(deferredQuery.toLowerCase());
  });

  return (
    <SectionCard eyebrow="Projects" title="Track shipping work and approvals">
      <TextInput
        className={inputClassName}
        onChangeText={setQuery}
        placeholder="Filter projects, workflows, or statuses"
        placeholderTextColor="#7b838e"
        value={query}
      />
      <View className="gap-3">
        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            name={project.name}
            progress={project.progress}
            status={project.status}
            summary={project.summary}
          />
        ))}
      </View>
      <Text className="text-sm leading-6 text-[#7b838e]">
        Sample attachments — connect Convex to upload real files.
      </Text>
      <View className="gap-3">
        {[...referenceProjectFiles, ...referenceArtifactExports].map((file) => (
          <FileRow
            key={file.id}
            detail={`${file.detail} · ${formatFileSize(file.sizeBytes)}`}
            label={file.fileName}
            status={file.status}
          />
        ))}
      </View>
    </SectionCard>
  );
}

export default function ProjectsScreen() {
  const mode = useAppMode();

  return (
    <AppScreen>
      {mode === "offline" ? (
        <OfflineProjects />
      ) : (
        <ScreenBoundary>
          <LiveProjects />
        </ScreenBoundary>
      )}
    </AppScreen>
  );
}
