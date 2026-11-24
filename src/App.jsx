import { useState } from "react";

/**
 * Login.jsx
 * Plataforma de conexión para buscar/ofrecer habitación.
 *
 * Paleta:
 *  - Panel de marca:      #1F2A2E (verde-pizarra oscuro)
 *  - Fondo / tarjeta:     #FBF9F5 (hueso cálido)
 *  - Acento (único color saturado): #C17A4D (terracota apagada)
 *  - Texto principal:     #1C2321
 *  - Texto secundario:    #74716A
 *  - Borde sutil:         #E7E2D6
 *
 * Tipografía: una sola familia (Sora), distintos pesos para jerarquía.
 * Carga la fuente, por ejemplo en index.html:
 * <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
 * y en tailwind.config.js: fontFamily: { sans: ['Sora', 'sans-serif'] }
 */

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const isRegister = mode === "register";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Conecta aquí tu lógica de autenticación (API, Supabase, Firebase, etc.)
    console.log(isRegister ? "Registrar" : "Iniciar sesión", form);
  };

  const handleGoogle = () => {
    // Conecta aquí tu flujo OAuth de Google
    console.log("Iniciar sesión con Google");
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-[#FBF9F5]">
      {/* Panel de marca — visible desde md hacia arriba */}
      <aside className="hidden md:flex md:w-2/5 lg:w-1/2 bg-[#1F2A2E] text-[#FBF9F5] flex-col justify-between p-10 lg:p-16 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#C17A4D]" />
          <span className="text-lg font-semibold tracking-tight">Aloja</span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-3xl lg:text-4xl font-light leading-snug text-[#FBF9F5]/95">
            Busca una habitación. O comparte la tuya con la persona correcta.
          </p>
          <p className="mt-4 text-sm text-[#FBF9F5]/55 leading-relaxed">
            Conecta con personas reales, no solo con anuncios.
          </p>

          {/* Mini tarjeta de listado — ancla el diseño en el producto real */}
          <div className="mt-8 rounded-xl bg-[#FBF9F5] p-3 max-w-xs shadow-xl shadow-black/20">
            <div className="h-32 rounded-lg bg-[#C17A4D]/25 relative overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgba(193,122,77,0.35), rgba(31,42,46,0.15))",
                }}
              />
              <span className="absolute top-2 right-2 text-[10px] font-medium bg-[#1F2A2E] text-[#FBF9F5] px-2 py-0.5 rounded-full">
                Disponible
              </span>
            </div>
            <div className="mt-2.5 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-[#1C2321]">
                  Habitación luminosa
                </p>
                <p className="text-xs text-[#74716A]">Condesa, CDMX</p>
              </div>
              <p className="text-sm font-semibold text-[#1C2321] whitespace-nowrap">
                $6,800
                <span className="text-[10px] font-normal text-[#74716A]">
                  /mes
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#FBF9F5]/35">
          © {new Date().getFullYear()} Aloja. Todos los derechos reservados.
        </div>
      </aside>

      {/* Panel de formulario */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Logo visible solo en mobile */}
          <div className="flex md:hidden items-center gap-2 mb-10">
            <div className="w-7 h-7 rounded-full bg-[#C17A4D]" />
            <span className="text-base font-semibold tracking-tight text-[#1C2321]">
              Aloja
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-[#1C2321]">
            {isRegister ? "Crea tu cuenta" : "Bienvenido de nuevo"}
          </h1>
          <p className="mt-1.5 text-sm text-[#74716A]">
            {isRegister
              ? "Regístrate para buscar habitación o publicar la tuya."
              : "Ingresa para ver tus conversaciones y búsquedas guardadas."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isRegister && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-[#1C2321] mb-1.5"
                >
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Tu nombre completo"
                  className="w-full rounded-lg border border-[#E7E2D6] bg-white px-3.5 py-2.5 text-sm text-[#1C2321] placeholder:text-[#A8A296] outline-none transition focus:border-[#C17A4D] focus:ring-2 focus:ring-[#C17A4D]/20"
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#1C2321] mb-1.5"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tucorreo@ejemplo.com"
                className="w-full rounded-lg border border-[#E7E2D6] bg-white px-3.5 py-2.5 text-sm text-[#1C2321] placeholder:text-[#A8A296] outline-none transition focus:border-[#C17A4D] focus:ring-2 focus:ring-[#C17A4D]/20"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-[#1C2321]"
                >
                  Contraseña
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    className="text-xs text-[#C17A4D] hover:text-[#A6613A] transition"
                  >
                    ¿La olvidaste?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#E7E2D6] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#1C2321] placeholder:text-[#A8A296] outline-none transition focus:border-[#C17A4D] focus:ring-2 focus:ring-[#C17A4D]/20"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#74716A] hover:text-[#1C2321] transition"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {/* Botón 1: acción primaria (cambia según el modo) */}
            <button
              type="submit"
              className="w-full rounded-lg bg-[#C17A4D] py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2"
            >
              {isRegister ? "Registrarse" : "Iniciar sesión"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E7E2D6]" />
            <span className="text-xs text-[#A8A296]">o continúa con</span>
            <div className="h-px flex-1 bg-[#E7E2D6]" />
          </div>

          {/* Botón 2: Google, jerarquía secundaria (outline, no relleno) */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-[#E7E2D6] bg-white py-2.5 text-sm font-medium text-[#1C2321] transition hover:border-[#1C2321]/25 hover:bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/30"
          >
            <GoogleIcon />
            Iniciar sesión con Google
          </button>

          {/* Botón 3: alternar entre iniciar sesión / registrarse */}
          <p className="mt-8 text-center text-sm text-[#74716A]">
            {isRegister ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(isRegister ? "login" : "register")}
              className="font-medium text-[#C17A4D] hover:text-[#A6613A] transition"
            >
              {isRegister ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.6 27 35.5 24 35.5c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.6 5.6C39.9 37 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

