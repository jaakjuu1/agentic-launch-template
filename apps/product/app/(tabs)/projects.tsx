import { AppScreen, SectionCard } from "@launch/ui-native";
import { useDeferredValue, useState } from "react";
import { TextInput, View } from "react-native";

import { ProjectRow } from "@/components/project-row";
import { referenceProjects } from "@/lib/reference-data";

export default function ProjectsScreen() {
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
      </SectionCard>
    </AppScreen>
  );
}
