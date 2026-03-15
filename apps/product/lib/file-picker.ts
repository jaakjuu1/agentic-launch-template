import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export type PickedLaunchFile = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uri?: string;
};

function pickWebFile(accept: string) {
  if (typeof document === "undefined") {
    return Promise.resolve<PickedLaunchFile | null>(null);
  }

  return new Promise<PickedLaunchFile | null>((resolve) => {
    const input = document.createElement("input");
    input.accept = accept;
    input.type = "file";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      resolve({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
    };
    input.click();
  });
}

export async function pickDocumentUpload() {
  if (Platform.OS === "web") {
    return pickWebFile(
      "application/pdf,text/plain,text/markdown,text/csv,application/json,audio/mpeg,audio/wav,audio/m4a",
    );
  }

  const result = await DocumentPicker.getDocumentAsync({
    multiple: false,
    type: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/json",
      "audio/mpeg",
      "audio/wav",
      "audio/m4a",
    ],
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }

  return {
    fileName: asset.name,
    mimeType: asset.mimeType ?? "application/octet-stream",
    sizeBytes: asset.size ?? 0,
    uri: asset.uri,
  } satisfies PickedLaunchFile;
}

export async function pickImageUpload() {
  if (Platform.OS === "web") {
    return pickWebFile("image/png,image/jpeg,image/webp");
  }

  const result = await ImagePicker.launchImageLibraryAsync();
  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }

  return {
    fileName: asset.fileName ?? `image-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? "image/jpeg",
    sizeBytes: asset.fileSize ?? 0,
    uri: asset.uri,
  } satisfies PickedLaunchFile;
}
