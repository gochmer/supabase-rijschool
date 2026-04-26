export const PACKAGE_COVER_BUCKET = "package-covers";
export const PACKAGE_COVER_MAX_BYTES = 5 * 1024 * 1024;
export const packageCoverMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
export const packageCoverAccept = packageCoverMimeTypes.join(",");

export type PackageCoverPositionKey =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right";

const packageCoverPositionMap = {
  center: {
    label: "Midden",
    description: "Neutrale uitsnede in het midden",
    x: 50,
    y: 50,
  },
  top: {
    label: "Boven",
    description: "Laat het bovenste deel beter zien",
    x: 50,
    y: 18,
  },
  bottom: {
    label: "Onder",
    description: "Laat het onderste deel beter zien",
    x: 50,
    y: 82,
  },
  left: {
    label: "Links",
    description: "Focus iets meer op de linkerkant",
    x: 28,
    y: 50,
  },
  right: {
    label: "Rechts",
    description: "Focus iets meer op de rechterkant",
    x: 72,
    y: 50,
  },
} as const satisfies Record<
  PackageCoverPositionKey,
  {
    label: string;
    description: string;
    x: number;
    y: number;
  }
>;

export const packageCoverPositionOptions = Object.entries(packageCoverPositionMap).map(
  ([key, value]) => ({
    key: key as PackageCoverPositionKey,
    label: value.label,
    description: value.description,
  })
);

function sanitizeFileSegment(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitFileName(fileName: string) {
  const sanitized = sanitizeFileSegment(fileName);
  const lastDotIndex = sanitized.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === sanitized.length - 1) {
    return {
      baseName: sanitized || "cover",
      extension: "jpg",
    };
  }

  const baseName = sanitized.slice(0, lastDotIndex).replace(/\./g, "-") || "cover";
  const extension =
    sanitized.slice(lastDotIndex + 1).replace(/[^a-z0-9]/g, "").slice(0, 8) || "jpg";

  return {
    baseName,
    extension,
  };
}

export function validatePackageCoverFile(file: { size: number; type: string }) {
  if (!packageCoverMimeTypes.includes(file.type as (typeof packageCoverMimeTypes)[number])) {
    return {
      success: false as const,
      message: "Gebruik een JPG, PNG, WebP of AVIF afbeelding voor de pakketcover.",
    };
  }

  if (file.size > PACKAGE_COVER_MAX_BYTES) {
    return {
      success: false as const,
      message: "De pakketcover mag maximaal 5 MB groot zijn.",
    };
  }

  return {
    success: true as const,
  };
}

export function isPackageCoverPositionKey(value: string): value is PackageCoverPositionKey {
  return value in packageCoverPositionMap;
}

export function getPackageCoverPositionKey(value?: string | null): PackageCoverPositionKey {
  return value && isPackageCoverPositionKey(value) ? value : "center";
}

export function getPackageCoverPositionConfig(positionKey?: string | null) {
  const safeKey = getPackageCoverPositionKey(positionKey);
  const config = packageCoverPositionMap[safeKey];

  return {
    key: safeKey,
    ...config,
    objectPosition: `${config.x}% ${config.y}%`,
  };
}

export function clampPackageCoverFocusValue(value: number) {
  const clamped = Math.max(0, Math.min(100, value));
  return Math.round(clamped * 100) / 100;
}

export function parsePackageCoverFocusValue(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));

  return Number.isFinite(parsed) ? clampPackageCoverFocusValue(parsed) : null;
}

export function getPackageCoverFocusPoint(
  positionKey?: string | null,
  focusX?: string | number | null,
  focusY?: string | number | null
) {
  const parsedFocusX = parsePackageCoverFocusValue(focusX);
  const parsedFocusY = parsePackageCoverFocusValue(focusY);

  if (parsedFocusX !== null && parsedFocusY !== null) {
    return {
      x: parsedFocusX,
      y: parsedFocusY,
      isCustom: true,
    };
  }

  const preset = getPackageCoverPositionConfig(positionKey);

  return {
    x: preset.x,
    y: preset.y,
    isCustom: false,
  };
}

export function getPackageCoverObjectPosition(
  positionKey?: string | null,
  focusX?: string | number | null,
  focusY?: string | number | null
) {
  const focusPoint = getPackageCoverFocusPoint(positionKey, focusX, focusY);
  return `${focusPoint.x}% ${focusPoint.y}%`;
}

export function buildPackageCoverPath(userId: string, fileName: string) {
  const { baseName, extension } = splitFileName(fileName);
  const shortBaseName = baseName.slice(0, 32) || "cover";

  return `${userId}/${Date.now()}-${shortBaseName}-${crypto.randomUUID()}.${extension}`;
}

export function getPackageCoverUrl(coverPath?: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || !coverPath) {
    return null;
  }

  return `${supabaseUrl}/storage/v1/object/public/${PACKAGE_COVER_BUCKET}/${coverPath}`;
}
