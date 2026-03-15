import { AppScreen, PrimaryButton, SectionCard } from "@launch/ui-native";
import { startTransition, useDeferredValue, useState } from "react";
import { TextInput, View } from "react-native";
import { FileRow } from "@/components/file-row";
import { ProjectRow } from "@/components/project-row";
import { formatFileSize } from "@/lib/file-helpers";
import { pickDocumentUpload, pickImageUpload } from "@/lib/file-picker";
import {
  referenceArtifactExports,
  referenceProjectFiles,
  referenceProjects,
} from "@/lib/reference-data";

export default function ProjectsScreen() {
  const [query, setQuery] = useState("");
  const [projectFiles, setProjectFiles] = useState<
    Array<(typeof referenceProjectFiles)[number]>
  >([...referenceProjectFiles]);
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
    <AppScreen>
      <SectionCard eyebrow="Projects" title="Track shipping work and approvals">
        <TextInput
          className="rounded-[18px] border border-[#16202a]/10 bg-white px-4 py-3 text-base text-[#16202a]"
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
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-3">
            <PrimaryButton
              label="Pick document"
              onPress={() => {
                void pickDocumentUpload().then((file) => {
                  if (!file) {
                    return;
                  }

                  startTransition(() => {
                    setProjectFiles((current) => [
                      ...current,
                      {
                        detail: "Project attachment · R2 pending upload",
                        fileName: file.fileName,
                        id: `project_upload_${current.length}`,
                        sizeBytes: file.sizeBytes,
                        status: "Queued",
                      },
                    ]);
                  });
                });
              }}
            />
            <PrimaryButton
              label="Attach image"
              onPress={() => {
                void pickImageUpload().then((file) => {
                  if (!file) {
                    return;
                  }

                  startTransition(() => {
                    setProjectFiles((current) => [
                      ...current,
                      {
                        detail: "Project attachment · image",
                        fileName: file.fileName,
                        id: `project_image_${current.length}`,
                        sizeBytes: file.sizeBytes,
                        status: "Queued",
                      },
                    ]);
                  });
                });
              }}
            />
          </View>
          {projectFiles.map((file) => (
            <FileRow
              key={file.id}
              detail={`${file.detail} · ${formatFileSize(file.sizeBytes)}`}
              label={file.fileName}
              status={file.status}
            />
          ))}
        </View>
        <View className="gap-3">
          {referenceArtifactExports.map((file) => (
            <FileRow
              key={file.id}
              detail={`${file.detail} · ${formatFileSize(file.sizeBytes)}`}
              label={file.fileName}
              onPress={() => undefined}
              status={file.status}
            />
          ))}
        </View>
      </SectionCard>
    </AppScreen>
  );
}
