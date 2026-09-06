# Frontend de gestión de solicitudes

El frontend está terminado para el alcance acordado del taller. Conserva el contrato de la API si realizas ajustes posteriores y acuerda cualquier cambio de campos, estados o rutas con el responsable del backend.

## Ejecutar

Desde la raíz del repositorio:

```powershell
npm ci
npm run dev:demo
```

Abrir `http://localhost:5173`. El backend usa memoria y dos casos ficticios; al reiniciarlo se reinician los datos. La interfaz avisa de este modo. Para usar AWS, seguir el README principal y ejecutar `npm run dev`.

No necesitas cuenta AWS para trabajar con los ejemplos. El frontend ya usa llamadas HTTP reales a Express en ambos modos; no tiene una lista local que reemplace silenciosamente la API.

## Dónde trabajar

| Archivo | Responsabilidad |
| --- | --- |
| `src/App.jsx` | Listado, filtro, paginación, mensajes y apertura del formulario. |
| `src/components/SolicitudForm.jsx` | Registro, detalle y edición de campos. |
| `src/components/SolicitudesTable.jsx` | Filas de solicitudes y cambio de estado. |
| `src/services/solicitudes.js` | Todas las llamadas HTTP a `/api`. |
| `src/catalogos.js` | Etiquetas de estados y ayudas; formato horario de Colombia. |
| `src/styles.css` | Estilos de referencia y adaptación a pantallas pequeñas. |
| `vite.config.js` | Proxy de `/api` hacia Express local en el puerto 3000. |

## Qué incluye la base

- Registrar y consultar solicitudes.
- Abrir detalle, editar y guardar.
- Cambiar el estado desde el listado.
- Filtrar por estado y cargar páginas adicionales.
- Mostrar carga, errores, lista vacía y confirmaciones.
- Mantener `documento` y `telefono` como texto.
- Mostrar la magnitud desconocida como campo vacío y enviarla como `null`.

## Reglas de integración

1. Consultar [el contrato de la API](../docs/API.md) antes de cambiar nombres o tipos.
2. No enviar ID, estado inicial ni fechas de seguimiento desde el formulario; el backend los controla.
3. Mantener las rutas relativas `/api`; funcionan en Vite con proxy y en Render desde el mismo origen.
4. No agregar credenciales AWS o claves secretas a variables `VITE_*`: esas variables son públicas al compilar.
5. Al cambiar filtros, reiniciar el cursor. Una página vacía puede tener más resultados después; conservar “Cargar más” si hay `nextCursor`.
6. Mostrar “solicitudes cargadas”, no “total de solicitudes”, porque no se consulta un conteo global.
7. Coordinar cualquier nuevo estado o tipo de ayuda con `backend/src/validation/solicitud.js`.
8. Mantener etiquetas accesibles, foco visible y controles utilizables con teclado.

## Cierre y comprobación

La interfaz incluye indicador del almacenamiento activo, avisos de modo de demostración, formulario en panel con foco y cierre mediante Escape, mensajes de éxito y error, y tarjetas legibles en pantallas pequeñas. No es necesario agregar mapas, un dashboard de estadísticas ni más librerías para completar el taller.

Antes de integrar cambios posteriores, ejecutar `npm run build` desde la raíz y probar registro, detalle, edición, estados, error del backend y paginación. Express publica `frontend/dist` junto con la API; la siguiente etapa es configurarlo en Render y repetir el recorrido desde la URL pública.
