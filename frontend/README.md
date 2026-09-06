# Base del frontend para el compañero

Esta es una primera interfaz funcional de referencia. Puedes cambiar el diseño y reorganizar componentes; conserva el contrato de la API o acuerda los cambios con el responsable del backend.

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

## Trabajo siguiente del frontend

Revisar con el grupo la presentación, los mensajes y la comodidad del formulario; ajustar la interfaz a lo solicitado por el profesor. No es necesario agregar mapas, un dashboard de estadísticas ni más librerías para completar el taller.

Antes de integrar los cambios, ejecutar `npm run build` desde la raíz y probar registro, detalle, edición, estados, error del backend y paginación. Express publicará `frontend/dist` en Render. La validación final contra AWS y la evaluación en la URL pública siguen pendientes.
