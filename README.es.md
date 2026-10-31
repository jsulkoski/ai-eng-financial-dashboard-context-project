# Panel de Métricas Financieras

<!-- hide -->

Por [@marcogonzalo](https://github.com/marcogonzalo) y [otros contribuidores](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors) en [4Geeks Academy](https://4geeksacademy.com/)

[![build by developers](https://img.shields.io/badge/build_by-Developers-blue)](https://4geeks.com)
[![4Geeks Academy](https://img.shields.io/twitter/follow/4geeksacademy?style=social&logo=x)](https://x.com/4geeksacademy)

_These instructions are [available in English](./README.md)._

**Antes de empezar**: 📗 [Lee las instrucciones](https://4geeks.com/es/lesson/como-comenzar-un-proyecto-de-codificacion) sobre cómo comenzar un proyecto de programación.

<!-- endhide -->

---

_Dashboard de métricas financieras con frontend en React + TypeScript y backend en FastAPI._

## Pasos recomendados

1. Haz un fork de este repositorio a tu cuenta.
2. Abre tu fork en GitHub Codespaces o clónalo y ejecútalo en tu entorno local.
3. Ejecuta tu agente de IA para inspeccionar frontend y backend.
4. Documenta las reglas propuestas y el banco de memoria en tu fork.
5. Ajusta y valida las reglas hasta que sean aplicables al flujo real del proyecto.

## Estructura esperada del directorio para agentes

```text
./.agents
└─ /rules
   └─ <nombre-regla>.md
└─ /skills
   └─ /<nombre-skill>
      └─ /SKILL.md
```

## Cómo ejecutar en local

```bash
docker compose up --build
```

El frontend usa por defecto el proxy de Vite para `/api`, así que no necesitas variables de entorno extra ni en desarrollo local ni en Codespaces.
Si necesitas apuntar a otro backend, copia `frontend/.env.example` como `.env` y define `VITE_API_BASE_URL`.

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Documentación API: http://localhost:8000/docs

## Guía para desarrolladores

- [Arquitectura y referencia de API](./docs/architecture.md): flujo de datos, rutas de API, lógica de cálculos y comandos de pruebas (disponible en inglés).
- [Memoria del proyecto](./memory-bank/project.md): producto, stack y estado actual verificados.
- [Registro de verificación](./verification.md): correcciones y comprobaciones fechadas contra el código y los servicios.
- [Reglas del backend](./.agents/rules/backend.md) y [reglas del frontend](./.agents/rules/frontend.md): convenciones específicas del proyecto.

## Ejecutar las pruebas

Desde la raíz del repositorio, ejecuta las pruebas del backend en Docker:

```bash
docker compose run --rm backend pytest -q
```

Para verificar el frontend, instala las dependencias y ejecuta los scripts existentes:

```bash
cd frontend
npm ci
npm test
npm run lint
npm run build
```

---

Este y muchos otros proyectos son construidos por estudiantes como parte de los [Coding Bootcamps](https://4geeksacademy.com/) de 4Geeks Academy. Encuentra más acerca de los [cursos](https://4geeksacademy.com/es/comparar-programas) de [Ingeniería de IA](https://4geeksacademy.com/es/coding-bootcamps/ingenieria-ia), [Data Science & Machine Learning](https://4geeksacademy.com/es/coding-bootcamps/curso-datascience-machine-learning), [Ciberseguridad](https://4geeksacademy.com/es/coding-bootcamps/curso-ciberseguridad) y [Full-Stack Software Developer con IA](https://4geeksacademy.com/es/coding-bootcamps/programador-full-stack).
