# Legendarium 📚🎬✨

Legendarium es una aplicación móvil multiplataforma diseñada para el seguimiento (**tracking**) personal de libros, películas y hábitos, con una estética editorial premium inspirada en el lenguaje de diseño de Claude/Anthropic.

## 🚀 Características principales

- **Libros:** Integración con Google Books API para búsqueda y gestión de lecturas.
- **Cine:** Integración con TMDB para catálogo de películas y valoraciones.
- **Hábitos:** Seguimiento de rutinas diarias con sistema de rachas (streaks).
- **Finanzas:** Escáner automático de correos (Gmail) para registrar gastos bancarios (Unicaja).
- **Diseño:** Interfaz minimalista con paleta de colores cálidos (Parchment & Terracotta) y tipografía serif.

## 🛠️ Stack Tecnológico

- **Backend:** FastAPI (Python 3.12) + Supabase (Postgres & Auth).
- **Mobile:** React Native + Expo + TypeScript.
- **Estilo:** Vanilla CSS (Web) / StyleSheet (Native) siguiendo las reglas de `DESIGN.md`.

## 📦 Instalación y Configuración

### Backend
1. Navega a `/backend`.
2. Crea un entorno virtual: `python -m venv venv`.
3. Activa el entorno:
   - Windows: `venv\Scripts\activate`
   - Unix: `source venv/bin/activate`
4. Instala dependencias: `pip install -r requirements.txt`.
5. Configura tu `.env` basándote en `.env.example`.
6. Ejecuta: `uvicorn app.main:app --reload`.

### Mobile
1. Navega a `/mobile`.
2. Instala dependencias: `npm install`.
3. Configura tu `.env` basándote en `.env.example`.
4. Ejecuta: `npx expo start`.

## 🎨 Guía de Diseño
El proyecto sigue estrictamente un sistema de diseño definido:
- **Fondo:** Parchment (`#f5f4ed`).
- **Tipografía:** Georgia (Titulares) e Inter (Cuerpo).
- **Acento:** Terracotta (`#c96442`).

---
Desarrollado con ❤️ por [Jaimeneira9](https://github.com/Jaimeneira9)
