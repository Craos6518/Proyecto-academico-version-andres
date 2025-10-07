# Comandos NPM - Sistema Académico

Este proyecto usa **npm** como administrador de paquetes. A continuación se muestran los comandos disponibles:

## Respuesta a "¿Cómo es el comando npm build?"

El comando correcto para construir el proyecto es:

```bash
npm run build
```

**NOTA IMPORTANTE:** No es `npm build` (sin "run"), sino `npm run build` (con "run").

## Todos los Comandos Disponibles

### 1. Instalar Dependencias
```bash
npm install
```
Este comando instala todas las dependencias del proyecto definidas en `package.json`.

### 2. Servidor de Desarrollo
```bash
npm run dev
```
Inicia el servidor de desarrollo en [http://localhost:3000](http://localhost:3000).
Los cambios se actualizan automáticamente (hot reload).

### 3. Construir para Producción
```bash
npm run build
```
Crea una versión optimizada del proyecto para producción.
Este comando debe ejecutarse antes de desplegar a producción.

### 4. Iniciar Servidor de Producción
```bash
npm start
```
Ejecuta la versión de producción del proyecto localmente.
Debe ejecutar `npm run build` primero.

### 5. Verificar Calidad del Código (Linting)
```bash
npm run lint
```
Analiza el código en busca de errores de estilo y problemas potenciales usando ESLint.

## Resolución de Problemas

### Múltiples Archivos de Bloqueo
Si ves el error: "Se encontraron varios archivos de bloqueo", asegúrate de que solo existe `package-lock.json` y elimina cualquier otro archivo de bloqueo:

```bash
# Eliminar archivos de bloqueo de otros gestores de paquetes
rm pnpm-lock.yaml  # Si existe
rm yarn.lock       # Si existe
```

Solo debe existir `package-lock.json` en la raíz del proyecto.

### Limpiar y Reinstalar
Si tienes problemas con las dependencias:

```bash
# 1. Eliminar node_modules y package-lock.json
rm -rf node_modules package-lock.json

# 2. Reinstalar todo
npm install

# 3. Intentar construir nuevamente
npm run build
```

## Estructura del Proyecto

- `app/` - Páginas y rutas de Next.js
- `components/` - Componentes reutilizables de React
- `lib/` - Utilidades y funciones auxiliares
- `public/` - Archivos estáticos
- `scripts/` - Scripts SQL para la base de datos

## Tecnologías Principales

- **Next.js 14** - Framework de React
- **React 18** - Biblioteca de UI
- **TypeScript** - Superset tipado de JavaScript
- **Tailwind CSS** - Framework de CSS
- **Radix UI** - Componentes UI accesibles

## Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de npm](https://docs.npmjs.com/)
- [Documentación del proyecto en v0.app](https://v0.app/chat/projects/7ajlp1Nu19p)
