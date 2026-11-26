import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { useNavigate } from "react-router-dom";
import { ApiClientError } from "../../../lib/api-error";
import { useAuth } from "../../auth/hooks/useAuth";
import BudgetZonesFields from "../components/BudgetZonesFields";
import LifestyleHabitsFields, {
  type LifestyleHabitsValue,
} from "../components/LifestyleHabitsFields";
import ProfileAvatarPicker from "../components/ProfileAvatarPicker";
import { useProfile } from "../hooks/useProfile";
import {
  createProfile,
  getMyProfile,
  uploadProfileAvatar,
} from "../services/profile.service";
import type {
  LifestyleProfile,
  ProfileNavigationState,
} from "../types/profile.types";
import {
  DEFAULT_LIFESTYLE_HABITS,
  formatCurrencyMxn,
  validateBudgetAndZones,
} from "../utils/profile-validation";

type OnboardingStep = 1 | 2 | 3 | 4;

const STEP_LABELS: readonly { step: OnboardingStep; title: string }[] = [
  { step: 1, title: "Presentación" },
  { step: 2, title: "Presupuesto y zonas" },
  { step: 3, title: "Convivencia" },
  { step: 4, title: "Revisión" },
] as const;

export default function OnboardingPage(): ReactElement {
  const { user } = useAuth();
  const { syncProfile } = useProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState<OnboardingStep>(1);
  const [bio, setBio] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");
  const [preferredZones, setPreferredZones] = useState<string[]>([]);
  const [habits, setHabits] = useState<LifestyleHabitsValue>({
    ...DEFAULT_LIFESTYLE_HABITS,
  });

  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatusLabel, setSubmitStatusLabel] =
    useState<string>("Creando perfil...");

  const submittingRef = useRef<boolean>(false);
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  const avatarPreviewUrl = useMemo<string | null>(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile],
  );

  useEffect(() => {
    if (!avatarPreviewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const handleNext = (): void => {
    if (isSubmitting) return;
    setStepError(null);

    if (step === 2) {
      const validation = validateBudgetAndZones(
        minBudget,
        maxBudget,
        preferredZones,
      );
      if (!validation.isValid) {
        setStepError(validation.error);
        return;
      }
      setPreferredZones(validation.preferredZones);
    }

    if (step < 4) {
      setStep((prev) => (prev + 1) as OnboardingStep);
    }
  };

  const handleBack = (): void => {
    if (isSubmitting || step <= 1) return;
    setStepError(null);
    setStep((prev) => (prev - 1) as OnboardingStep);
  };

  const handleConfirmSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (step !== 4) {
      handleNext();
      return;
    }

    if (submittingRef.current || isSubmitting) {
      return;
    }

    const submitUserId = user?.id ?? null;
    if (!submitUserId) {
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
      setStepError(validation.error);
      setStep(2);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setStepError(null);
    setSubmitStatusLabel("Creando tu perfil...");

    const trimmedBio = bio.trim();

    try {
      // 1. Create the lifestyle profile first (required before avatar upload)
      let createdProfile: LifestyleProfile;
      try {
        const createResponse = await createProfile({
          minBudget: validation.minBudget,
          maxBudget: validation.maxBudget,
          preferredZones: validation.preferredZones,
          hasPets: habits.hasPets,
          toleratesPets: habits.toleratesPets,
          isSmoker: habits.isSmoker,
          toleratesSmokers: habits.toleratesSmokers,
          ...(trimmedBio.length > 0 ? { bio: trimmedBio } : {}),
        });
        createdProfile = createResponse.data;
      } catch (createError: unknown) {
        // Recover cleanly from 409 Conflict if the profile already exists on the backend
        if (
          createError instanceof ApiClientError &&
          createError.kind === "http" &&
          createError.status === 409
        ) {
          setSubmitStatusLabel("Sincronizando perfil existente...");
          const existingResponse = await getMyProfile();

          if (activeUserIdRef.current !== submitUserId) {
            return;
          }

          navigate("/app", { replace: true });
          syncProfile(existingResponse.data);
          return;
        }

        throw createError;
      }

      if (activeUserIdRef.current !== submitUserId) {
        return;
      }

      // 2. Keep created profile locally and upload optional avatar before syncing ProfileProvider
      //    so OnboardingRoute never unmounts this page mid-upload.
      let finalProfile = createdProfile;
      let avatarWarning: string | null = null;

      if (avatarFile) {
        setSubmitStatusLabel("Subiendo tu fotografía...");
        try {
          const uploadResponse = await uploadProfileAvatar(avatarFile);
          finalProfile = uploadResponse.data;
        } catch (uploadError: unknown) {
          avatarWarning =
            uploadError instanceof ApiClientError
              ? `Tu perfil fue creado correctamente, pero no se pudo subir la fotografía: ${uploadError.message}`
              : "Tu perfil fue creado correctamente, pero no se pudo subir la fotografía. Puedes intentarlo de nuevo aquí.";
        }
      }

      if (activeUserIdRef.current !== submitUserId) {
        return;
      }

      // 3. Navigate first and synchronize ProfileProvider in the same batch so
      //    the user lands on /app (or /app/profile with warning) without premature redirects.
      if (avatarWarning) {
        const navState: ProfileNavigationState = { avatarWarning };
        navigate("/app/profile", { replace: true, state: navState });
        syncProfile(finalProfile);
      } else {
        navigate("/app", { replace: true });
        syncProfile(finalProfile);
      }
    } catch (error: unknown) {
      if (activeUserIdRef.current !== submitUserId) {
        return;
      }

      if (error instanceof ApiClientError) {
        setStepError(error.message);
      } else {
        setStepError(
          "No se pudo completar la creación de tu perfil. Intenta nuevamente.",
        );
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const budgetSummary = validateBudgetAndZones(
    minBudget,
    maxBudget,
    preferredZones,
  );

  return (
    <section className="w-full max-w-2xl rounded-2xl border border-[#E7E2D6] bg-white p-6 sm:p-8 shadow-sm">
      {/* Encabezado y progreso */}
      <div>
        <span className="inline-block rounded-full bg-[#C17A4D]/15 px-3 py-1 text-xs font-medium text-[#8C4D27]">
          Paso {step} de 4
        </span>
        <h1 className="mt-3 text-2xl font-semibold text-[#1C2321]">
          Configura tu perfil de convivencia
        </h1>
        <p className="mt-1 text-sm text-[#74716A]">
          Completa tu Lifestyle Profile para empezar a conectar con roomies
          compatibles en Querétaro.
        </p>

        {/* Barra de etapas */}
        <ol
          className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2"
          aria-label="Etapas del onboarding"
        >
          {STEP_LABELS.map((item) => {
            const isCurrent = item.step === step;
            const isCompleted = item.step < step;
            return (
              <li
                key={item.step}
                aria-current={isCurrent ? "step" : undefined}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  isCurrent
                    ? "border-[#C17A4D] bg-[#C17A4D]/10 text-[#8C4D27]"
                    : isCompleted
                      ? "border-[#1F2A2E] bg-[#1F2A2E] text-[#FBF9F5]"
                      : "border-[#E7E2D6] bg-[#FBF9F5] text-[#74716A]"
                }`}
              >
                <span className="mr-1.5 opacity-75">{item.step}.</span>
                {item.title}
              </li>
            );
          })}
        </ol>
      </div>

      {stepError && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-[#C17A4D]/40 bg-[#C17A4D]/10 px-4 py-3 text-xs text-[#8C4D27]"
        >
          {stepError}
        </div>
      )}

      <form onSubmit={handleConfirmSubmit} className="mt-6" noValidate>
        {/* Etapa 1: Presentación y biografía */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#E7E2D6] bg-[#FBF9F5] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[#74716A]">Nombre</p>
                <p className="mt-0.5 font-medium text-[#1C2321]">
                  {user?.fullName ?? "Usuario"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#74716A]">Correo electrónico</p>
                <p className="mt-0.5 font-medium text-[#1C2321] truncate">
                  {user?.email ?? ""}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[#1C2321] mb-2">
                Fotografía de perfil{" "}
                <span className="font-normal text-[#74716A]">(opcional)</span>
              </p>
              <ProfileAvatarPicker
                fullName={user?.fullName ?? "Usuario"}
                currentAvatarUrl={null}
                selectedFile={avatarFile}
                onFileSelect={setAvatarFile}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="onboarding-bio"
                className="block text-sm font-medium text-[#1C2321] mb-1.5"
              >
                Cuéntanos sobre ti{" "}
                <span className="font-normal text-[#74716A]">(opcional)</span>
              </label>
              <textarea
                id="onboarding-bio"
                name="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ej. Estudio ingeniería, soy ordenado, me gusta cocinar y busco un ambiente tranquilo entre semana."
                className="w-full rounded-lg border border-[#E7E2D6] bg-white px-3.5 py-2.5 text-sm text-[#1C2321] placeholder:text-[#A8A296] outline-none transition focus:border-[#C17A4D] focus:ring-2 focus:ring-[#C17A4D]/20 disabled:opacity-60 resize-y"
              />
            </div>
          </div>
        )}

        {/* Etapa 2: Presupuesto y zonas de interés */}
        {step === 2 && (
          <BudgetZonesFields
            minBudget={minBudget}
            maxBudget={maxBudget}
            preferredZones={preferredZones}
            onMinBudgetChange={(val) => {
              setMinBudget(val);
              if (stepError) setStepError(null);
            }}
            onMaxBudgetChange={(val) => {
              setMaxBudget(val);
              if (stepError) setStepError(null);
            }}
            onPreferredZonesChange={(zones) => {
              setPreferredZones(zones);
              if (stepError) setStepError(null);
            }}
            disabled={isSubmitting}
          />
        )}

        {/* Etapa 3: Hábitos y preferencias */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-[#1C2321]">
                Hábitos y preferencias de convivencia
              </h2>
              <p className="mt-0.5 text-xs text-[#74716A]">
                Activa las opciones que mejor describan tu estilo de vida.
              </p>
            </div>

            <LifestyleHabitsFields
              value={habits}
              onChange={setHabits}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Etapa 4: Revisión y confirmación */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-medium text-[#1C2321]">
                Revisa tu información antes de continuar
              </h2>
              <p className="mt-0.5 text-xs text-[#74716A]">
                Podrás editar cualquiera de estas preferencias más adelante
                desde tu perfil.
              </p>
            </div>

            <div className="rounded-xl border border-[#E7E2D6] bg-[#FBF9F5] p-5 space-y-4 text-sm">
              <div className="flex items-center gap-3.5">
                {avatarPreviewUrl ? (
                  <img
                    src={avatarPreviewUrl}
                    alt="Vista previa de tu fotografía"
                    className="h-14 w-14 rounded-full object-cover border border-[#E7E2D6]"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-[#1F2A2E] text-[#FBF9F5] flex items-center justify-center text-sm font-semibold">
                    {(user?.fullName ?? "RM").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-[#1C2321] truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-[#74716A] truncate">
                    {avatarFile
                      ? `Fotografía lista para subir: ${avatarFile.name}`
                      : "Sin fotografía seleccionada (podrás agregarla después)"}
                  </p>
                </div>
              </div>

              <div className="h-px bg-[#E7E2D6]" />

              <div>
                <p className="text-xs font-medium text-[#74716A]">Biografía</p>
                <p className="mt-1 text-sm text-[#1C2321]">
                  {bio.trim().length > 0 ? bio.trim() : "Sin biografía por ahora"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-[#74716A]">
                    Rango de presupuesto
                  </p>
                  <p className="mt-1 font-medium text-[#1C2321]">
                    {budgetSummary.minBudget !== null &&
                    budgetSummary.maxBudget !== null
                      ? `${formatCurrencyMxn(budgetSummary.minBudget)} – ${formatCurrencyMxn(budgetSummary.maxBudget)} / mes`
                      : "Por definir"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#74716A]">
                    Zonas de interés
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {preferredZones.map((zone) => (
                      <span
                        key={zone}
                        className="rounded-full bg-[#1F2A2E] px-2.5 py-0.5 text-xs text-[#FBF9F5]"
                      >
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-[#74716A]">
                  Preferencias de convivencia
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white border border-[#E7E2D6] px-3 py-2 flex justify-between">
                    <dt className="text-[#74716A]">Tiene mascotas</dt>
                    <dd className="font-medium text-[#1C2321]">
                      {habits.hasPets ? "Sí" : "No"}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-white border border-[#E7E2D6] px-3 py-2 flex justify-between">
                    <dt className="text-[#74716A]">Acepta mascotas</dt>
                    <dd className="font-medium text-[#1C2321]">
                      {habits.toleratesPets ? "Sí" : "No"}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-white border border-[#E7E2D6] px-3 py-2 flex justify-between">
                    <dt className="text-[#74716A]">Fumador</dt>
                    <dd className="font-medium text-[#1C2321]">
                      {habits.isSmoker ? "Sí" : "No"}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-white border border-[#E7E2D6] px-3 py-2 flex justify-between">
                    <dt className="text-[#74716A]">Acepta fumadores</dt>
                    <dd className="font-medium text-[#1C2321]">
                      {habits.toleratesSmokers ? "Sí" : "No"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Controles de navegación entre etapas */}
        <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-[#E7E2D6]">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="rounded-lg border border-[#E7E2D6] bg-white px-4 py-2.5 text-sm font-medium text-[#1C2321] transition hover:border-[#1C2321]/25 hover:bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/30 disabled:opacity-60"
            >
              Atrás
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="rounded-lg bg-[#C17A4D] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2 disabled:opacity-60"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="rounded-lg bg-[#C17A4D] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? submitStatusLabel : "Guardar y continuar"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
