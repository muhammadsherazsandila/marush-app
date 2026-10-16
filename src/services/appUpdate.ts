import { Platform } from "react-native";

const CURRENT_VERSION = "1.0.0";
const RELEASES_API_URL =
  "https://api.github.com/repos/muhammadsherazsandila/marush-app/releases/latest";

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  body?: string | null;
  assets?: {
    name: string;
    browser_download_url: string;
  }[];
}

export interface AppUpdate {
  version: string;
  downloadUrl: string;
  releaseUrl: string;
  notes: string;
}

const versionParts = (version: string) =>
  version
    .replace(/^[^\d]*/, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

const isNewerVersion = (candidate: string, current: string) => {
  const candidateParts = versionParts(candidate);
  const currentParts = versionParts(current);

  for (let index = 0; index < 3; index += 1) {
    if ((candidateParts[index] || 0) !== (currentParts[index] || 0)) {
      return (candidateParts[index] || 0) > (currentParts[index] || 0);
    }
  }

  return false;
};

export const checkForAppUpdate = async (): Promise<AppUpdate | null> => {
  if (Platform.OS !== "android") return null;

  const response = await fetch(RELEASES_API_URL, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!response.ok) {
    throw new Error(`Release check failed with status ${response.status}.`);
  }

  const release = (await response.json()) as GitHubRelease;
  const version = release.tag_name.replace(/^android-v/i, "").replace(/^v/i, "");
  const apk = release.assets?.find((asset) => asset.name.endsWith(".apk"));

  if (!apk || !isNewerVersion(version, CURRENT_VERSION)) return null;

  return {
    version,
    downloadUrl: apk.browser_download_url,
    releaseUrl: release.html_url,
    notes: release.body?.trim() || "A newer version of Marush is available.",
  };
};
