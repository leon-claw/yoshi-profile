import { resolveDollImageUrl } from "../lib/dollImages";

type DollImageProps = {
  image: string;
  label: string;
  className?: string;
  loading?: "eager" | "lazy";
};

export function DollImage({ image, label, className = "", loading = "lazy" }: DollImageProps) {
  const src = resolveDollImageUrl(image);

  if (!src) {
    return (
      <span className={`doll-image ${className}`} data-missing="true" role="img" aria-label={`${label} 图片未找到`}>
        <span className="doll-image__placeholder">{initialFromLabel(label)}</span>
      </span>
    );
  }

  return (
    <span className={`doll-image ${className}`}>
      <img src={src} alt={label} loading={loading} decoding="async" />
    </span>
  );
}

function initialFromLabel(label: string) {
  return label.trim().slice(0, 1).toUpperCase() || "?";
}
