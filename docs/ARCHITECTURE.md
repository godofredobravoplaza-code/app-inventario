# 🏗️ ARCHITECTURE.md - Estructura Técnica y Esquema de Datos

## 1. Stack Tecnológico
- **Frontend:** Next.js 14+ (App Router), React, Tailwind CSS, Lucide-React, Shadcn UI / Radix Primitives.
- **Backend / Database:** Supabase (PostgreSQL, Auth, RLS).
- **Almacenamiento PDF:** Google Drive API v3 (Service Account).
- **Notificaciones Transaccionales:** Resend API / SMTP.
- **Hosting / Deploy:** Vercel (`https://*.vercel.app`).
- **UI Theme:** Modern Slate & Electric Indigo (`#4F46E5`).

---

## 2. Estructura de Carpetas Next.js 14 App Router
```text
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx              # Login con casilla "Recordarme"
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard Principal / Acceso Rápido
│   │   ├── inventory/
│   │   │   ├── page.tsx                # Tabla/Cards de Inventario
│   │   │   └── [id]/page.tsx           # Ficha de Equipo y Trazabilidad
│   │   ├── der/
│   │   │   └── new/page.tsx            # Formulario y Firma DER
│   │   ├── guides/
│   │   │   └── new/page.tsx            # Captura de Guías Sonda/Teknoservice
│   │   └── admin/
│   │       ├── audit-log/page.tsx      # Historial y Diff de Cambios
│   │       ├── trash/page.tsx          # Papelera de Reciclaje (Soft Delete)
│   │       └── settings/page.tsx       # Mantenedores (Categorías, Modelos, Filiales)
│   ├── api/
│   │   ├── der/generate/route.ts       # Generador de PDF y Subida a Drive
│   │   ├── guides/process/route.ts
│   │   └── audit/notify/route.ts       # Disparador de Correos Resend
├── components/
│   ├── ui/                             # Botones, Modales, Badges, Inputs
│   ├── signature-canvas.tsx            # Modal de Firma Digital
│   ├── scanner-camera.tsx              # Lector de Código de Barras / Serie
│   └── mobile-bottom-bar.tsx           # Navegación fija para celular
├── lib/
│   ├── supabase/                       # Clientes Supabase (Server / Client)
│   ├── google-drive.ts                 # Service Account Integración API
│   └── resend.ts                       # Helper de envío de correos
└── types/
    └── index.ts                        # Interfaces TypeScript