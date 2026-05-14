# Mesa de ayuda

Sistema de gestión de solicitudes de soporte técnico: API con Node.js y Express, base de datos MongoDB (Mongoose), login con JWT y páginas web en la carpeta `public/`.

**Versión:** 1.0.0 · **Licencia:** ISC · **Repositorio:** https://github.com/kevinserrano72/mesa-de-ayuda

Trabaje siempre en la carpeta raíz del proyecto (donde están `package.json` y `server.js`).

## Requisitos

- Node.js 18 o superior
- Una base MongoDB (local o Atlas) y su cadena de conexión

## Instalación

```bash
git clone https://github.com/kevinserrano72/mesa-de-ayuda.git
cd mesa-de-ayuda
npm install
```

Cree el archivo de entorno copiando el ejemplo:

- Windows: `copy .env.example .env`
- Linux o Mac: `cp .env.example .env`

Abra `.env` y complete:

- `MONGODB_URI` (obligatorio): por ejemplo `mongodb://127.0.0.1:27017/mesa-de-ayuda` en local
- `JWT_SECRET` (obligatorio): texto largo y secreto para los tokens
- `PORT` (opcional): puerto del servidor; si no lo pone, usa 3000

## Cómo ejecutarlo

1. Que MongoDB esté accesible con la URI configurada.
2. Arranque el servidor:

   - Desarrollo (se reinicia al cambiar código): `npm run dev`
   - Modo normal: `npm start`

3. En el navegador: http://localhost:3000 (o el puerto que puso en `PORT`).

Comprobar que el servidor responde: abra o llame a `GET /api/health`.

## Datos de prueba (desarrollo)

```bash
npm run seed
```

Crea usuario administrador y solicitudes de ejemplo. Puede borrar o pisar datos de prueba; úselo solo en entornos de desarrollo.

Después del seed, suele poder entrar con:

- Correo: `admin@empresa.com`
- Contraseña: `Admin123!`

Para solo restablecer la contraseña del admin: `npm run reset-admin`.

## Comandos útiles

| Comando | Para qué sirve |
|---------|----------------|
| `npm run dev` | Servidor con nodemon |
| `npm start` | Servidor con node |
| `npm run seed` | Rellenar base con datos de prueba |
| `npm run reset-admin` | Restablecer contraseña del administrador |

## API (resumen)

Las rutas que no son login ni health necesitan la cabecera:

`Authorization: Bearer <token>`

El token sale de `POST /api/auth/login` con JSON `{"email":"...","password":"..."}`.

| Método | Ruta | Con token |
|--------|------|-----------|
| POST | /api/auth/login | No |
| GET | /api/solicitudes | Sí (filtros: estado, prioridad, tipo, busqueda) |
| GET | /api/solicitudes/:id | Sí (id = ObjectId de MongoDB) |
| POST | /api/solicitudes | Sí |
| PUT | /api/solicitudes/:id | Sí |
| DELETE | /api/solicitudes/:id | Sí |
| GET | /api/stats | Sí |
| GET | /api/health | No |

Estados de una solicitud: Registrada, En Proceso, Resuelta, Cerrada, Anulada. Al crear, el estado inicial es Registrada.

## Carpetas principales

- `server.js` — arranque del servidor y rutas
- `public/` — HTML, CSS y JS del front
- `src/` — modelos, rutas API, middleware, conexión a MongoDB y scripts (`seed`, reset de admin)

Si en el repo hay archivos como `02_DESARROLLO_INTEGRACION.md`, sirven como documentación extra del curso o la entrega.

## Dudas o errores

Abra un issue en: https://github.com/kevinserrano72/mesa-de-ayuda/issues
