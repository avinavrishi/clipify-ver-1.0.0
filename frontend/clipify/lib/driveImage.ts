export function toDriveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const raw = url.trim();
  if (!raw) return null;

  // Already a direct "uc" link
  if (raw.includes("drive.google.com/uc?")) return raw;

  // Common patterns:
  // - https://drive.google.com/file/d/<id>/view?...
  // - https://drive.google.com/open?id=<id>
  // - https://drive.google.com/drive/folders/<id> (not an image, ignore)
  const fileIdMatch =
    raw.match(/drive\.google\.com\/file\/d\/([^/]+)/i) ??
    raw.match(/[?&]id=([^&]+)/i);

  const id = fileIdMatch?.[1];
  if (!id) return raw; // fall back to whatever was provided

  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
}

