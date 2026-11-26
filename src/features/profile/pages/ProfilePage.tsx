import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { useLocation } from "react-router-dom";
import { ApiClientError } from "../../../lib/api-error";
import { useAuth } from "../../auth/hooks/useAuth";
import BudgetZonesFields from "../components/BudgetZonesFields";
import LifestyleHabitsFields, {
  type LifestyleHabitsValue,
} from "../components/LifestyleHabitsFields";
import ProfileAvatarPicker from "../components/ProfileAvatarPicker";
import { useProfile } from "../hooks/useProfile";
import {
  updateMyProfile,
  uploadProfileAvatar,
} from "../services/profile.service";
import type { LifestyleProfile } from "../types/profile.types";
import { validateBudgetAndZones } from "../utils/profile-validation";

function extractAvatarWarning(state: unknown): string | null {
  if (typeof state !== "object" || state === null) {
    return null;
  }

  const candidate = (state as Record<string, unknown>).avatarWarning;
  return typeof candidate === "string" && candidate.trim().length > 0
    ? candidate.trim()
    : null;
}

interface ProfileEditorProps {
  profile: LifestyleProfile;
  userFullName: string;
  userEmail: string;
  initialAvatarWarning: string | null;
}

function ProfileEditor({
  profile,
  userFullName,
  userEmail,
  initialAvatarWarning,
}: ProfileEditorProps): ReactElement {
  const { syncProfile } = useProfile();

  const [minBudget, setMinBudget] = useState<string>(String(profile.minBudget));
  const [maxBudget, setMaxBudget] = useState<string>(String(profile.maxBudget));
  const [preferredZones, setPreferredZones] = useState<string[]>(
    profile.preferredZones,
  );
  const [habits, setHabits] = useState<LifestyleHabitsValue>({
    hasPets: profile.hasPets,
    toleratesPets: profile.toleratesPets,
    isSmoker: profile.isSmoker,
    toleratesSmokers: profile.toleratesSmokers,
  });
  const [bio, setBio] = useState<string>(profile.bio ?? "");

  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
  const [avatarWarning, setAvatarWarning] = useState<string | null>(
    initialAvatarWarning,
  );
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  const savingProfileRef = useRef<boolean>(false);
  const uploadingAvatarRef = useRef<boolean>(false);
  const ownerUserIdRef = useRef<string>(profile.userId);

  useEffect(() => {
    ownerUserIdRef.current = profile.userId;
  }, [profile.userId]);

  const handleUploadAvatar = async (): Promise<void> => {
    if (
      !selectedAvatarFile ||
      uploadingAvatarRef.current ||
      isUploadingAvatar
    ) {
      return;
    }

    const requestUserId = ownerUserIdRef.current;
    uploadingAvatarRef.current = true;
    setIsUploadingAvatar(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    try {
      const response = await uploadProfileAvatar(selectedAvatarFile);

      if (ownerUserIdRef.current !== requestUserId) {
        return;
      }

      syncProfile(response.data);
      setSelectedAvatarFile(null);
      setAvatarWarning(null);
      setAvatarSuccess(
        response.message ?? "Fotografía de perfil actualizada exitosamente.",
      );
    } catch (error: unknown) {
      if (ownerUserIdRef.current !== requestUserId) {
        return;
      }

      if (error instanceof ApiClientError) {
        setAvatarError(error.message);
      } else {
        setAvatarError(
          "No se pudo subir la fotografía. Verifica el archivo e intenta nuevamente.",
        );
      }
    } finally {
      uploadingAvatarRef.current = false;
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (
    e: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (savingProfileRef.current || isSavingProfile) {
      return;
    }

    const validation = validateBudgetAndZones(
      minBudget,
      maxBudget,
      preferredZones,
    );
    if (
      !validation.isValid ||
      validation.minBudget === null ||
      validation.maxBudget === null
    ) {
      setFormError(validation.error);
      setFormSuccess(null);
      return;
    }

    const requestUserId = ownerUserIdRef.current;
    savingProfileRef.current = true;
    setIsSavingProfile(true);
    setFormError(null);
    setFormSuccess(null);

    const trimmedBio = bio.trim();

    try {
      const response = await updateMyProfile({
        minBudget: validation.minBudget,
        maxBudget: validation.maxBudget,
        preferredZones: validation.preferredZones,
        hasPets: habits.hasPets,
        toleratesPets: habits.toleratesPets,
        isSmoker: habits.isSmoker,
        toleratesSmokers: habits.toleratesSmokers,
        bio: trimmedBio.length > 0 ? trimmedBio : null,
      });

      if (ownerUserIdRef.current !== requestUserId) {
        return;
      }

      syncProfile(response.data);
      setPreferredZones(response.data.preferredZones);
      setMinBudget(String(response.data.minBudget));
      setMaxBudget(String(response.data.maxBudget));
      setBio(response.data.bio ?? "");
      setFormSuccess(response.message ?? "Perfil actualizado exitosamente.");
    } catch (error: unknown) {
      if (ownerUserIdRef.current !== requestUserId) {
        return;
      }

      if (error instanceof ApiClientError) {
        setFormError(error.message);
      } else {
        setFormError("No se pudieron guardar los cambios. Intenta nuevamente.");
      }
    } finally {
      savingProfileRef.current = false;
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Encabezado de cuenta y fotografía */}
      <section className="rounded-2xl border border-[#E7E2D6] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-[#E7E2D6]">
          <div>
            <h1 className="text-2xl font-semibold text-[#1C2321]">
              Mi perfil de convivencia
            </h1>
            <p className="mt-1 text-sm text-[#74716A]">
              Administra tus preferencias, biografía y fotografía de perfil.
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-[#1F2A2E] px-3 py-1 text-xs font-medium text-[#FBF9F5]">
            Perfil activo
          </span>
        </div>

        {/* Datos de cuenta (solo lectura según contrato del backend) */}
        <dl className="mt-5 rounded-xl border border-[#E7E2D6] bg-[#FBF9F5] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-[#74716A]">Nombre</dt>
            <dd className="mt-0.5 font-medium text-[#1C2321]">
              {userFullName}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#74716A]">Correo electrónico</dt>
            <dd className="mt-0.5 font-medium text-[#1C2321] truncate">
              {userEmail}
            </dd>
          </div>
        </dl>

        {/* Aviso si falló la foto durante onboarding */}
        {avatarWarning && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-[#C17A4D]/40 bg-[#C17A4D]/10 px-4 py-3 text-xs text-[#8C4D27]"
          >
            {avatarWarning}
          </div>
        )}

        {avatarSuccess && (
          <div
            role="status"
            className="mt-5 rounded-lg border border-[#1F2A2E]/20 bg-[#1F2A2E]/5 px-4 py-3 text-xs text-[#1F2A2E]"
          >
            {avatarSuccess}
          </div>
        )}

        {avatarError && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-[#C17A4D]/40 bg-[#C17A4D]/10 px-4 py-3 text-xs text-[#8C4D27]"
          >
            {avatarError}
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-medium text-[#1C2321] mb-3">
            Fotografía de perfil
          </h2>
          <ProfileAvatarPicker
            fullName={userFullName}
            currentAvatarUrl={profile.avatarUrl}
            selectedFile={selectedAvatarFile}
            onFileSelect={(file) => {
              setSelectedAvatarFile(file);
              setAvatarError(null);
              setAvatarSuccess(null);
            }}
            disabled={isUploadingAvatar}
          />

          {selectedAvatarFile && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleUploadAvatar}
                disabled={isUploadingAvatar}
                aria-busy={isUploadingAvatar}
                className="rounded-lg bg-[#C17A4D] px-5 py-2 text-xs font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUploadingAvatar
                  ? "Subiendo fotografía..."
                  : "Guardar fotografía"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Edición de preferencias y biografía */}
      <section className="rounded-2xl border border-[#E7E2D6] bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1C2321]">
          Preferencias de Lifestyle Profile
        </h2>
        <p className="mt-1 text-xs text-[#74716A]">
          Actualiza tu presupuesto, zonas de interés, hábitos y biografía.
        </p>

        {formSuccess && (
          <div
            role="status"
            className="mt-5 rounded-lg border border-[#1F2A2E]/20 bg-[#1F2A2E]/5 px-4 py-3 text-xs text-[#1F2A2E]"
          >
            {formSuccess}
          </div>
        )}

        {formError && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-[#C17A4D]/40 bg-[#C17A4D]/10 px-4 py-3 text-xs text-[#8C4D27]"
          >
            {formError}
          </div>
        )}

        <form
          onSubmit={handleSaveProfile}
          className="mt-6 space-y-6"
          noValidate
        >
          <BudgetZonesFields
            minBudget={minBudget}
            maxBudget={maxBudget}
            preferredZones={preferredZones}
            onMinBudgetChange={(val) => {
              setMinBudget(val);
              if (formError) setFormError(null);
              if (formSuccess) setFormSuccess(null);
            }}
            onMaxBudgetChange={(val) => {
              setMaxBudget(val);
              if (formError) setFormError(null);
              if (formSuccess) setFormSuccess(null);
            }}
            onPreferredZonesChange={(zones) => {
              setPreferredZones(zones);
              if (formError) setFormError(null);
              if (formSuccess) setFormSuccess(null);
            }}
            disabled={isSavingProfile}
          />

          <div className="h-px bg-[#E7E2D6]" />

          <div>
            <h3 className="text-sm font-medium text-[#1C2321] mb-3">
              Hábitos y convivencia
            </h3>
            <LifestyleHabitsFields
              value={habits}
              onChange={(next) => {
                setHabits(next);
                if (formSuccess) setFormSuccess(null);
              }}
              disabled={isSavingProfile}
            />
          </div>

          <div className="h-px bg-[#E7E2D6]" />

          <div>
            <label
              htmlFor="profile-bio"
              className="block text-sm font-medium text-[#1C2321] mb-1.5"
            >
              Biografía{" "}
              <span className="font-normal text-[#74716A]">(opcional)</span>
            </label>
            <textarea
              id="profile-bio"
              name="bio"
              rows={4}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                if (formSuccess) setFormSuccess(null);
              }}
              disabled={isSavingProfile}
              placeholder="Comparte un poco sobre tu rutina, horarios o qué buscas en un roomie."
              className="w-full rounded-lg border border-[#E7E2D6] bg-white px-3.5 py-2.5 text-sm text-[#1C2321] placeholder:text-[#A8A296] outline-none transition focus:border-[#C17A4D] focus:ring-2 focus:ring-[#C17A4D]/20 disabled:opacity-60 resize-y"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              aria-busy={isSavingProfile}
              className="w-full sm:w-auto rounded-lg bg-[#C17A4D] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingProfile ? "Guardando cambios..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function ProfilePage(): ReactElement {
  const { user } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();

  if (!profile) {
    return (
      <div className="text-sm text-[#74716A]">Cargando datos del perfil...</div>
    );
  }

  return (
    <ProfileEditor
      key={profile.userId}
      profile={profile}
      userFullName={user?.fullName ?? "Usuario"}
      userEmail={user?.email ?? ""}
      initialAvatarWarning={extractAvatarWarning(location.state)}
    />
  );
}

