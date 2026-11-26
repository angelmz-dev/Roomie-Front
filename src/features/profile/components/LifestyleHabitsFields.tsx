import type { ReactElement } from "react";

export interface LifestyleHabitsValue {
  hasPets: boolean;
  toleratesPets: boolean;
  isSmoker: boolean;
  toleratesSmokers: boolean;
}

interface LifestyleHabitsFieldsProps {
  value: LifestyleHabitsValue;
  onChange: (nextValue: LifestyleHabitsValue) => void;
  disabled?: boolean;
}

interface HabitToggleConfig {
  key: keyof LifestyleHabitsValue;
  title: string;
  description: string;
}

const HABIT_ITEMS: readonly HabitToggleConfig[] = [
  {
    key: "hasPets",
    title: "Tengo mascotas",
    description: "Indica si vivirás acompañado de una mascota.",
  },
  {
    key: "toleratesPets",
    title: "Acepto mascotas",
    description: "Permite conectar con roomies que tengan mascotas.",
  },
  {
    key: "isSmoker",
    title: "Soy fumador",
    description: "Ayuda a encontrar personas compatibles con este hábito.",
  },
  {
    key: "toleratesSmokers",
    title: "Acepto fumadores",
    description: "Indica si te resulta cómodo convivir con personas que fuman.",
  },
] as const;

export default function LifestyleHabitsFields({
  value,
  onChange,
  disabled = false,
}: LifestyleHabitsFieldsProps): ReactElement {
  const handleToggle = (key: keyof LifestyleHabitsValue): void => {
    if (disabled) return;
    onChange({
      ...value,
      [key]: !value[key],
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {HABIT_ITEMS.map((item) => {
        const checked = value[item.key];
        return (
          <button
            key={item.key}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => handleToggle(item.key)}
            className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/35 disabled:opacity-60 ${
              checked
                ? "border-[#C17A4D] bg-[#C17A4D]/5"
                : "border-[#E7E2D6] bg-white hover:border-[#1C2321]/25"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1C2321]">{item.title}</p>
              <p className="mt-1 text-xs text-[#74716A] leading-relaxed">
                {item.description}
              </p>
            </div>

            <span
              aria-hidden="true"
              className={`mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
                checked ? "bg-[#C17A4D]" : "bg-[#E7E2D6]"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  checked ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}

