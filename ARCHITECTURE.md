# Arquitectura del Proyecto Wiki-IA

## Estructura Actual

```
Wiki-IA/
├── index.html              # Página principal (entrada de GitHub Pages)
├── README.md
├── css/
│   └── styles.css         # Estilos globales
├── js/
│   └── script.js          # JavaScript del frontend
├── assets/                # Imágenes, iconos, recursos
├── pages/                 # Páginas adicionales del sitio
└── backend/               # Backend (futuro)
    ├── api/              # PHP - Endpoints de base de datos
    └── chatbot/          # Python - Servidor del chatbot
```

## Roadmap de Desarrollo

### Fase 1: Frontend Estático (ACTUAL)
- ✅ HTML, CSS, JavaScript puro
- ✅ GitHub Pages para hosting
- ✅ Sin backend, todo estático

### Fase 2: Base de Datos (PHP)
- `backend/api/` contendrá:
  - Scripts PHP para CRUD de IAs
  - Conexión a MySQL/PostgreSQL
  - API REST para el frontend

### Fase 3: Chatbot IA (Python)
- `backend/chatbot/` contendrá:
  - Servidor Flask o FastAPI
  - Integración con APIs de IA
  - WebSocket para chat en tiempo real

## Migración Futura

Cuando agregues backend, necesitarás:

1. **Hosting con soporte dinámico:**
   - Railway, Render, Heroku
   - VPS con Apache/Nginx
   - PythonAnywhere

2. **Opciones de arquitectura:**

   **Opción A - Monolito:**
   - Todo en un solo servidor
   - PHP y Python en el mismo host

   **Opción B - Separado (recomendado):**
   - Frontend estático → GitHub Pages/Netlify
   - API PHP → Servidor 1
   - Chatbot Python → Servidor 2
   - Comunicación vía CORS

## 📝 Notas

- El `index.html` se mantiene en la raíz para GitHub Pages
- Las carpetas backend están listas para cuando las necesites
- No requiere cambios en el código actual
