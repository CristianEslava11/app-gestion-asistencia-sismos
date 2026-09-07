# Contrato de la API

Este documento describe la API del proyecto. La base es `/api` y todas las respuestas principales usan JSON.

## 1. Resumen

La aplicación permite registrar, consultar, listar y actualizar solicitudes de asistencia por sismos.

### Endpoints principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Verifica que la API esté activa. |
| GET | `/api/config` | Devuelve la configuración activa del almacenamiento (`dynamodb` o `memory`). |
| POST | `/api/solicitudes` | Crea una nueva solicitud. |
| GET | `/api/solicitudes` | Lista solicitudes con filtros y paginación básica. |
| GET | `/api/solicitudes/:id` | Consulta una solicitud por su identificador. |
| PUT | `/api/solicitudes/:id` | Actualiza una solicitud completa. |
| PATCH | `/api/solicitudes/:id/estado` | Actualiza solo el estado de la solicitud. |

## 2. Crear una solicitud

### Endpoint

`POST /api/solicitudes`

### Headers

```http
Content-Type: application/json
```

### Body

```json
{
  "nombre": "Persona ficticia",
  "documento": "000123",
  "telefono": "3000000000",
  "municipio": "Tunja",
  "direccion": "Dirección ficticia, zona norte",
  "fechaSismo": "2026-08-20",
  "magnitud": 5.2,
  "tipoAyuda": "ALOJAMIENTO",
  "observaciones": "Caso de demostración académica."
}
```

### Campos que el backend agrega automáticamente

- `solicitudId`
- `estado` = `PENDIENTE`
- `fechaSolicitud`
- `fechaActualizacion`

No se deben enviar esos campos desde el cliente porque el sistema los genera.

### Validaciones principales

- `nombre`: obligatorio
- `documento`: obligatorio
- `telefono`: obligatorio
- `municipio`: obligatorio
- `direccion`: obligatorio
- `fechaSismo`: formato `YYYY-MM-DD`
- `magnitud`: número o `null`
- `tipoAyuda`: uno de los valores permitidos
- `observaciones`: opcional

## 3. Listar solicitudes

### Endpoint

`GET /api/solicitudes`

### Query params

```text
GET /api/solicitudes?limit=20&estado=PENDIENTE
GET /api/solicitudes?limit=20&estado=PENDIENTE&cursor=VALOR_DEVUELTO
```

Parámetros:

- `limit`: número entero entre 1 y 100
- `estado`: opcional, valores permitidos: `PENDIENTE`, `EN_ATENCION`, `ATENDIDA`
- `cursor`: token para paginación, devuelto por la API en la respuesta anterior

### Respuesta esperada

```json
{
  "data": [
    {
      "solicitudId": "uuid",
      "nombre": "Persona ficticia",
      "estado": "PENDIENTE"
    }
  ],
  "nextCursor": null
}
```

## 4. Consultar y actualizar una solicitud

### Consultar por id

`GET /api/solicitudes/:id`

### Actualizar completa

`PUT /api/solicitudes/:id`

Este endpoint reemplaza los campos editables de la solicitud y actualiza `fechaActualizacion`.

### Cambiar solo estado

`PATCH /api/solicitudes/:id/estado`

Body:

```json
{
  "estado": "EN_ATENCION"
}
```

Valores admitidos:

- `PENDIENTE`
- `EN_ATENCION`
- `ATENDIDA`

## 5. Respuestas de error

La API devuelve errores con este formato:

```json
{
  "error": {
    "message": "Revisa los datos enviados.",
    "details": [
      {
        "field": "nombre",
        "message": "Detalle de validación"
      }
    ]
  }
}
```

### Códigos HTTP más comunes

| Código | Significado |
| --- | --- |
| 400 | Datos inválidos o solicitud mal formada. |
| 401 | Autenticación requerida. |
| 404 | Ruta o solicitud no encontrada. |
| 413 | Cuerpo demasiado grande. |
| 503 | Error al acceder al almacenamiento. |

## 6. Seguridad y desarrollo

- Las credenciales de AWS se manejan solo en el backend.
- No se exponen en el navegador.
- Si está configurada, la autenticación HTTP Basic protege la API y la interfaz.
- En desarrollo, el proyecto puede ejecutarse en modo demo sin usar DynamoDB real.

## 7. Nota
Este documento es útil para entender cómo se comunica la aplicación con el backend y cómo se estructuran las solicitudes.
