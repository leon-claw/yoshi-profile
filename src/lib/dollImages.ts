const dollImageModules = import.meta.glob<string>(
  "../assets/dolls/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

const dollImageUrls = new Map(
  Object.entries(dollImageModules).flatMap(([path, url]) => {
    const fileName = fileNameFromPath(path);
    return [
      [fileName, url] as const,
      [fileName.toLowerCase(), url] as const,
    ];
  }),
);

export function resolveDollImageUrl(imageName: string): string | undefined {
  const fileName = fileNameFromPath(imageName.trim());
  return dollImageUrls.get(fileName) ?? dollImageUrls.get(fileName.toLowerCase());
}

function fileNameFromPath(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}
