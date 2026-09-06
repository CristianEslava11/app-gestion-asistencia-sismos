# Entrega de trabajo al responsable del frontend

Este documento se puede compartir directamente con el compañero encargado del frontend. El proyecto ya incluye una interfaz funcional de referencia, una API Express y dos registros ficticios para desarrollar sin acceso a AWS.

## Qué debe hacer ahora

El siguiente paso es continuar y mejorar la interfaz existente en la carpeta `frontend`. Debe revisar el formulario, el listado, el detalle y la edición de solicitudes, y ajustar la presentación para que la aplicación sea clara y cómoda de usar. El alcance del taller es pequeño: no hace falta agregar mapas, estadísticas, autenticación propia, archivos adjuntos ni nuevas librerías salvo que el grupo lo acuerde.

La interfaz ya permite:

- Registrar una solicitud.
- Listar las solicitudes.
- Consultar y editar una solicitud.
- Cambiar su estado.
- Filtrar por estado y cargar más resultados.
- Mostrar estados de carga, error, lista vacía y confirmación.

Puede cambiar estilos y reorganizar componentes. Si necesita cambiar nombres de campos, rutas, estados o tipos de ayuda, debe acordarlo primero con el responsable del backend para mantener compatible la API.

## Cómo descargar y ejecutar el proyecto sin AWS

Requisitos: Git, Node.js 22.12 o superior dentro de las versiones 22–24 y npm.

```powershell
git clone URL_DEL_REPOSITORIO
cd app-gestion-asistencia-sismos
npm ci
npm run dev:demo
```

Abrir `http://localhost:5173`.

`npm run dev:demo` inicia dos procesos:

- El frontend con Vite en el puerto 5173.
- El backend Express en el puerto 3000 usando memoria y dos solicitudes ficticias.

No necesita cuenta AWS, credenciales, archivo `.env` ni acceso a DynamoDB. El frontend sigue llamando a la API real de Express; solamente cambia el repositorio de almacenamiento. Los datos creados permanecen al recargar la página, pero se pierden al detener o reiniciar el backend. La pantalla muestra un aviso cuando está en este modo.

Para detener ambos procesos puede pulsar `Ctrl+C` en la terminal.

## Datos que utiliza una solicitud

| Campo | Tipo que usa el frontend | Obligatorio | Regla importante |
| --- | --- | --- | --- |
| `nombre` | texto | Sí | Entre 2 y 120 caracteres. |
| `documento` | texto | Sí | Entre 3 y 30 caracteres; debe conservar ceros iniciales. |
| `telefono` | texto | Sí | Entre 7 y 25 caracteres. |
| `municipio` | texto | Sí | Entre 2 y 100 caracteres. |
| `direccion` | texto | Sí | Entre 3 y 200 caracteres. |
| `fechaSismo` | texto `YYYY-MM-DD` | Sí | Debe ser una fecha existente y no futura. |
| `magnitud` | número o `null` | No | Entre 0 y 10; si no se conoce, enviar `null`. |
| `tipoAyuda` | texto de catálogo | Sí | Usar uno de los valores indicados abajo. |
| `observaciones` | texto | No | Máximo 1500 caracteres; puede enviarse como cadena vacía. |

El backend agrega estos campos; el formulario no debe enviarlos al registrar o editar:

- `solicitudId`: UUID y clave primaria de DynamoDB.
- `estado`: inicialmente `PENDIENTE`.
- `fechaSolicitud`: instante de creación en UTC.
- `fechaActualizacion`: instante de la última modificación en UTC.

Valores permitidos para `tipoAyuda`:

| Valor de API | Texto visible sugerido |
| --- | --- |
| `ALIMENTACION` | Alimentación |
| `ALOJAMIENTO` | Alojamiento |
| `ATENCION_MEDICA` | Atención médica |
| `RESCATE` | Rescate |
| `OTRA` | Otra |

Valores permitidos para `estado`:

| Valor de API | Texto visible sugerido |
| --- | --- |
| `PENDIENTE` | Pendiente |
| `EN_ATENCION` | En atención |
| `ATENDIDA` | Atendida |

## API que consume el frontend

El frontend siempre debe usar rutas relativas que comiencen por `/api`. En desarrollo, Vite las dirige al backend local. En Render, el frontend y Express compartirán el mismo dominio.

| Operación | Método y ruta |
| --- | --- |
| Conocer el modo de almacenamiento | `GET /api/config` |
| Listar | `GET /api/solicitudes?limit=20` |
| Filtrar | `GET /api/solicitudes?limit=20&estado=PENDIENTE` |
| Continuar una página | Agregar `&cursor=VALOR_RECIBIDO` manteniendo el filtro. |
| Consultar detalle | `GET /api/solicitudes/:id` |
| Registrar | `POST /api/solicitudes` |
| Editar datos | `PUT /api/solicitudes/:id` |
| Cambiar estado | `PATCH /api/solicitudes/:id/estado` |

Ejemplo de cuerpo para registrar o editar:

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

Ejemplo para cambiar el estado:

```json
{ "estado": "EN_ATENCION" }
```

Las respuestas exitosas contienen `data`. El listado contiene además `nextCursor`, que vale `null` cuando no hay otra página. Una página filtrada puede estar vacía y todavía tener `nextCursor`; el botón “Cargar más” debe mantenerse mientras exista ese valor.

Los errores tienen esta forma:

```json
{
  "error": {
    "message": "Revisa los datos enviados.",
    "details": [
      { "field": "nombre", "message": "Detalle de validación" }
    ]
  }
}
```

La especificación completa está en `docs/API.md`.

## Archivos principales del frontend

| Archivo | Responsabilidad |
| --- | --- |
| `frontend/src/App.jsx` | Listado, filtro, paginación, mensajes y apertura del formulario. |
| `frontend/src/components/SolicitudForm.jsx` | Registro, detalle y edición de campos. |
| `frontend/src/components/SolicitudesTable.jsx` | Filas y cambio de estado. |
| `frontend/src/services/solicitudes.js` | Todas las llamadas HTTP a `/api`. |
| `frontend/src/catalogos.js` | Estados, tipos de ayuda y formato de fechas. |
| `frontend/src/styles.css` | Estilos y adaptación a pantallas pequeñas. |
| `frontend/vite.config.js` | Proxy local hacia Express en el puerto 3000. |

No debe colocar credenciales de AWS en el frontend, en archivos `VITE_*`, en GitHub ni en mensajes del grupo. Las variables de Vite quedan visibles dentro del JavaScript que recibe el navegador.

## Comprobaciones antes de entregar sus cambios

1. Registrar un caso ficticio, abrirlo, editarlo y cambiar su estado.
2. Probar el filtro y el botón “Cargar más” cuando aparezca.
3. Comprobar la vista en un ancho pequeño y con navegación por teclado.
4. Detener el backend para confirmar que la interfaz muestra un error y permite reintentar.
5. Volver a iniciar con `npm run dev:demo` y verificar la recuperación.
6. Ejecutar desde la raíz:

```powershell
npm run build
npm test
```

Debe subir sus cambios en una rama propia para que el grupo los revise antes de integrarlos en `main`.

```powershell
git switch -c frontend/nombre-del-cambio
git add frontend docs/GUIA_COMPANERO_FRONTEND.md
git commit -m "feat(frontend): describir el cambio"
git push -u origin frontend/nombre-del-cambio
```

Después puede abrir un Pull Request hacia `main` en GitHub.
