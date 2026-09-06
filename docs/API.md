# Contrato de la API

Base: `/api`. JSON de entrada y salida. Fechas de seguimiento UTC; `fechaSismo` es solo una fecha. Identificadores UUID. Esta versión usa los valores definidos en `backend/src/validation/solicitud.js`.

## Rutas

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/health` | `200 { "status": "ok" }`; sonda de proceso fuera de `/api`. |
| GET | `/api/config` | `200 { "data": { "storageMode": "dynamodb" } }` o `memory`. Informa configuración, no conectividad. |
| POST | `/api/solicitudes` | `201 { "data": solicitud }` y encabezado `Location`. |
| GET | `/api/solicitudes` | `200 { "data": [...], "nextCursor": null o string }`. |
| GET | `/api/solicitudes/:id` | `200 { "data": solicitud }`. |
| PUT | `/api/solicitudes/:id` | Reemplaza los campos editables y devuelve el ítem actualizado. |
| PATCH | `/api/solicitudes/:id/estado` | Cambia estado y devuelve el ítem actualizado. |

## Registrar y editar

Enviar `Content-Type: application/json`. POST y PUT reciben el mismo cuerpo:

```json
{
  "nombre": "Persona ficticia",
  "documento": "000123",
  "telefono": "0000000000",
  "municipio": "Tunja",
  "direccion": "Dirección ficticia, zona norte",
  "fechaSismo": "2026-08-20",
  "magnitud": 5.2,
  "tipoAyuda": "ALOJAMIENTO",
  "observaciones": "Caso de demostración académica."
}
```

El backend agrega `solicitudId`, `estado=PENDIENTE`, `fechaSolicitud` y `fechaActualizacion`. No enviar esos campos en POST o PUT: se rechazan, igual que cualquier campo desconocido. PUT mantiene el ID, el estado actual y la fecha original de solicitud; actualiza `fechaActualizacion`. PUT requiere todos los campos obligatorios; omitir `magnitud` la deja en `null` y omitir `observaciones` la deja en `""`.

Los tipos y límites completos están en el README. El documento se envía como texto, nunca como número. `magnitud` se envía como número o `null`, nunca como texto vacío. `fechaSismo` usa `YYYY-MM-DD` sin conversión de zona horaria.

## Cambiar estado

```json
{ "estado": "EN_ATENCION" }
```

Valores admitidos: `PENDIENTE`, `EN_ATENCION`, `ATENDIDA`. Se permite cualquier transición en esta versión. `fechaActualizacion` cambia automáticamente.

## Listar y filtrar

```text
GET /api/solicitudes?limit=20&estado=PENDIENTE
GET /api/solicitudes?limit=20&estado=PENDIENTE&cursor=VALOR_DEVUELTO
```

- `limit`: entero entre 1 y 100; predeterminado 20.
- `estado`: opcional, uno de los tres estados.
- `cursor`: token opaco de la respuesta anterior. No construirlo manualmente. Codificarlo con `URLSearchParams`.
- Mantener el mismo filtro al continuar. Al cambiarlo, descartar el cursor y el listado anterior.
- `nextCursor=null` indica que no hay otra página; la longitud de `data` no lo determina.
- `data` puede estar vacío y aun así contener `nextCursor` por el filtro posterior a la lectura.
- No se proporciona orden global, total global ni paginación por número de página.

## Errores

```json
{
  "error": {
    "message": "Revisa los datos enviados.",
    "details": [{ "field": "nombre", "message": "Detalle de validación" }]
  }
}
```

| Estado HTTP | Significado |
| --- | --- |
| 400 | Entrada, ID, consulta, cursor o JSON inválido. |
| 401 | Falta el acceso de evaluación si está configurado. |
| 404 | Solicitud o ruta inexistente. Editar una solicitud inexistente no la crea. |
| 413 | Cuerpo mayor a 32 KB. |
| 503 | Fallo de acceso al almacenamiento. Nunca se devuelve una lista ficticia como sustituto. |

`details` solo se incluye para validación. No depender del texto exacto de los mensajes de Zod. El frontend debe mostrar el error y permitir reintentar.

## Autenticación y desarrollo

Las credenciales de AWS solo existen en el backend. El acceso HTTP Basic de evaluación, si se configura, protege interfaz y API excepto `/health`; no se debe hardcodear en el frontend. En Render se utiliza HTTPS. En desarrollo sin acceso configurado, `npm run dev:demo` permite probar directamente.
