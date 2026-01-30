# Solución al error "Failed to Fetch" en GitHub Codespaces

## Problema
El error "failed to fetch" ocurre porque el frontend no puede comunicarse con el backend en GitHub Codespaces.

## Soluciones Aplicadas

### 1. ✅ Configuración de URL dinámica
Se actualizó `js/auth.js` para detectar automáticamente el ambiente de Codespaces y usar la URL correcta del backend.

### 2. ✅ Configuración de CORS
Se actualizó `backend/server.js` para permitir peticiones desde cualquier origen (necesario en Codespaces).

### 3. ✅ Configuración de DevContainer
Se creó `.devcontainer/devcontainer.json` para configurar automáticamente los puertos.

## Pasos para resolver el problema AHORA

### Opción A: Hacer visible el puerto 3000 manualmente (MÁS RÁPIDO)

1. En VS Code, busca la pestaña **"PUERTOS"** o **"PORTS"** en la parte inferior
2. Localiza el puerto **3000**
3. Haz clic derecho sobre él
4. Selecciona **"Port Visibility" → "Public"**
5. Recarga tu página web del frontend (F5)
6. Intenta registrarte de nuevo

### Opción B: Rebuild del Codespace (más permanente)

1. Presiona `F1` o `Ctrl+Shift+P`
2. Busca y selecciona: **"Codespaces: Rebuild Container"**
3. Espera a que se reconstruya el contenedor
4. Una vez listo, el puerto 3000 estará configurado automáticamente como público

## Verificación

Para verificar que todo funciona:

1. Abre la consola del navegador (F12)
2. Busca el mensaje: `🌐 Detectado ambiente Codespaces. API URL: ...`
3. Intenta registrarte
4. Si ves errores diferentes a "failed to fetch", son errores del backend (más fáciles de resolver)

## Estructura de Puertos

- **Puerto 5500**: Frontend (HTML/CSS/JS)
- **Puerto 3000**: Backend API (Node.js + Express)

Ambos deben estar visibles y públicos para que la aplicación funcione correctamente en Codespaces.
