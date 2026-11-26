import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import { validateAvatarFile } from "../utils/profile-validation";

interface ProfileAvatarPickerProps {
  fullName: string;
  currentAvatarUrl: string | null;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  helperText?: string;
}

function getUserInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function ProfileAvatarPicker({
  fullName,
  currentAvatarUrl,
  selectedFile,
  onFileSelect,
  disabled = false,
  helperText = "Formatos permitidos: JPEG, PNG o WebP. Tamaño máximo: 5 MB.",
}: ProfileAvatarPickerProps): ReactElement {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const previewUrl = useMemo<string | null>(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setFileError(validationError);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setFileError(null);
    onFileSelect(file);
  };

  const handleClearSelection = (): void => {
    setFileError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const displayImageUrl = previewUrl ?? currentAvatarUrl;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden border border-[#E7E2D6] bg-[#1F2A2E] flex items-center justify-center">
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={`Fotografía de perfil de ${fullName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-lg font-semibold text-[#FBF9F5] tracking-wide">
            {getUserInitials(fullName)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <label
            htmlFor={inputId}
            className={`inline-flex items-center justify-center rounded-lg border border-[#E7E2D6] bg-white px-3.5 py-2 text-xs font-medium text-[#1C2321] transition focus-within:ring-2 focus-within:ring-[#C17A4D]/30 ${
              disabled
                ? "opacity-60 cursor-not-allowed"
                : "cursor-pointer hover:border-[#1C2321]/25 hover:bg-[#FBF9F5]"
            }`}
          >
            {displayImageUrl ? "Cambiar fotografía" : "Seleccionar fotografía"}
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={disabled}
              className="sr-only"
            />
          </label>

          {selectedFile && (
            <button
              type="button"
              onClick={handleClearSelection}
              disabled={disabled}
              className="rounded-lg px-2.5 py-2 text-xs font-medium text-[#74716A] transition hover:text-[#1C2321] disabled:opacity-60"
            >
              Quitar selección
            </button>
          )}
        </div>

        <p className="mt-1.5 text-xs text-[#74716A]">
          {selectedFile ? `Seleccionada: ${selectedFile.name}` : helperText}
        </p>

        {fileError && (
          <p role="alert" className="mt-1.5 text-xs text-[#8C4D27]">
            {fileError}
          </p>
        )}
      </div>
    </div>
  );
}
