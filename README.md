# Gestión de solicitudes de asistencia por sismos

Taller de la Electiva de Bases de Datos. Una persona encargada registra solicitudes de personas afectadas por sismos y realiza seguimiento a su atención.

**Estado:** base ejecutable implementada, tabla creada en AWS e integración real verificada desde Express. Publicación en Render pendiente. La interfaz es un punto de partida para el compañero de frontend.

**URL pública:** pendiente de desplegar.  
**Integrantes:** completar con el grupo.

## Guías del proyecto

- [Decisiones y responsabilidades](docs/DECISIONES.md).
- [Contrato de la API](docs/API.md).
- [Guía para continuar el frontend](frontend/README.md).
- [Entrega completa para el compañero de frontend](docs/GUIA_COMPANERO_FRONTEND.md).

## Arquitectura

```text
Navegador → Render: Express + frontend compilado → DynamoDB en AWS
```

Frontend: React + Vite, JavaScript y CSS. Backend: Node.js + Express 5, validación con Zod y AWS SDK v3. Un repositorio con npm workspaces, un solo archivo de dependencias bloqueadas y un solo servicio en Render.

El backend genera el UUID y las fechas de seguimiento. El navegador nunca recibe credenciales de AWS. No hay DynamoDB Local ni otra base de datos que sustituya el requisito de AWS.

## Iniciar la base sin configurar AWS

Requisitos: Node.js 22.12 o superior dentro de las versiones 22–24, npm y acceso a Internet para instalar dependencias. Los comandos se ejecutan desde la raíz del repositorio.

```powershell
npm ci
npm run dev:demo
```

Abrir [http://localhost:5173](http://localhost:5173). Vite ejecuta el frontend y dirige `/api` al backend del puerto 3000.

Este comando selecciona **memoria explícitamente** y carga dos casos ficticios. Los cambios sobreviven a recargar el navegador, pero se pierden al reiniciar el backend. La pantalla muestra un aviso. Es una ayuda de desarrollo, no la demostración de persistencia requerida por el taller.

## DynamoDB: modelo y justificación

Tabla **`SolicitudesAsistencia`**, con clave de partición **`solicitudId` de tipo String**, sin clave de ordenamiento ni índices secundarios en esta primera versión. Cada ítem representa una solicitud; una persona puede aparecer en varias solicitudes. `documento` no es único.

| Atributo | Tipo almacenado | Regla de la aplicación |
| --- | --- | --- |
| `solicitudId` | String | UUID generado por el backend; clave primaria. |
| `nombre` | String | Obligatorio, 2–120 caracteres. |
| `documento` | String | Obligatorio, 3–30 caracteres; conserva ceros iniciales y letras. |
| `telefono` | String | Obligatorio, 7–25 caracteres; admite dígitos, espacios, `+`, paréntesis y guiones. |
| `municipio` | String | Obligatorio, 2–100 caracteres. |
| `direccion` | String | Obligatoria, 3–200 caracteres. |
| `fechaSismo` | String | Fecha real `YYYY-MM-DD`, no futura según el día de Colombia. |
| `fechaSolicitud` | String | Instante ISO 8601 en UTC; generado al crear, inmutable. |
| `magnitud` | Number o Null | Opcional. Rango de entrada del taller: 0–10; desconocida se guarda como `null`, no como 0. |
| `tipoAyuda` | String | `ALIMENTACION`, `ALOJAMIENTO`, `ATENCION_MEDICA`, `RESCATE` u `OTRA`. |
| `estado` | String | `PENDIENTE`, `EN_ATENCION` o `ATENDIDA`; inicialmente `PENDIENTE`. |
| `observaciones` | String | Opcional, máximo 1500 caracteres; por defecto cadena vacía. |
| `fechaActualizacion` | String | Instante ISO 8601 en UTC; se actualiza al editar o cambiar estado. |

Al crear la tabla **solo se declara `solicitudId`** en las definiciones de atributos. Los demás atributos se escriben con cada ítem; no se crean columnas previamente. La validación de estos campos corresponde a Express/Zod. [Operaciones básicas de tablas en AWS](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithTables.Basics.html).

### Patrones de acceso

| Operación | Operación DynamoDB | Decisión |
| --- | --- | --- |
| Registrar | `PutItem` | Condición `attribute_not_exists(solicitudId)` para evitar sobrescritura accidental. |
| Consultar por ID | `GetItem` | Acceso directo por clave primaria, lectura consistente. |
| Editar o cambiar estado | `UpdateItem` | Condición `attribute_exists(solicitudId)`; no crea registros al editar un ID inexistente. |
| Listar | `Scan` paginado | Adecuado para el volumen pequeño del taller, sin prometer orden cronológico. |
| Filtrar por estado | `Scan` con `FilterExpression` | El filtro se aplica después de leer; no reduce las lecturas facturadas. |

`limit` limita los ítems **evaluados**, no las coincidencias. Una página filtrada puede estar vacía y todavía incluir `nextCursor`. El frontend mantiene el botón “Cargar más” en ese caso. El listado no es una instantánea transaccional: cambios concurrentes pueden afectar las páginas. [Paginación y filtros de Scan](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html).

No se agrega un índice por anticipado. Si creciera el volumen o se necesitara consultar frecuentemente por estado y fecha, se evaluaría un GSI con partición `estado` y ordenamiento `fechaSolicitud` para usar `Query`. Eso es una mejora futura, no una capacidad implementada.

La configuración inicial usa **capacidad bajo demanda (`PAY_PER_REQUEST`)**. AWS puede cobrar por solicitudes y almacenamiento; revisar los créditos y condiciones de la cuenta. [Capacidad bajo demanda](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/on-demand-capacity-mode.html).

## Crear la tabla real en AWS

La tabla del taller ya está creada y activa en **Ohio (`us-east-2`)**, según la consola compartida por el responsable. El backend y Render usan esa región por defecto. Los pasos siguientes permiten reproducir la creación en otra cuenta; no hace falta crear de nuevo la tabla existente.

### Opción A: consola de AWS

1. Entrar a DynamoDB en la región elegida y seleccionar **Crear tabla**.
2. Nombre: `SolicitudesAsistencia`.
3. Clave de partición: `solicitudId`, tipo **String**. Dejar vacía la clave de ordenamiento.
4. Verificar que el modo de capacidad sea **bajo demanda**. No agregar índices para esta versión.
5. Crear y esperar a que la tabla esté **Activa**.

### Opción B: script del repositorio

Primero configurar un perfil de AWS con credenciales fuera del repositorio y permisos de `CreateTable` y `DescribeTable` para esta tarea. La política de ejecución de Render, descrita abajo, no incluye permisos de creación.

Copiar la configuración de ejemplo:

```powershell
Copy-Item backend/.env.example backend/.env
```

Editar `backend/.env`: región, nombre de tabla y, si se necesita, `AWS_PROFILE`. Usar un perfil configurado mediante AWS CLI o variables de credenciales del entorno. No pegar credenciales en archivos versionados.

```powershell
npm run db:create
```

Este comando usa [la definición de la tabla](infra/dynamodb-table.json), espera a que esté activa y no cambia una tabla existente. Si ya existe, verifica la clave. Se necesitan credenciales válidas y acceso a AWS; no es un emulador.

### Acceso de la aplicación y ejemplos

Usar [la política IAM de ejecución](infra/iam-runtime-policy.json), preparada con el ARN de la tabla del taller. Para reproducir el proyecto en otra cuenta o región, sustituir el ARN por el de la nueva tabla. Permite `GetItem`, `PutItem`, `UpdateItem` y `Scan` sobre una sola tabla. No usar claves del usuario raíz ni permisos de administrador para Render.

Para cargar ejemplos, con `PutItem` autorizado:

```powershell
npm run db:seed
```

Los ejemplos tienen IDs fijos; ejecutar el script varias veces no sobrescribe los registros existentes, aunque se hayan editado.

La integración se verificó el 5 de septiembre de 2026 con el perfil local `asistencia-sismos`: se cargaron dos registros ficticios, Express los leyó desde DynamoDB y se comprobó una actualización de estado mediante la API. El registro utilizado se restauró a `PENDIENTE` al finalizar.

## Ejecutar con DynamoDB real

Con la tabla creada y `backend/.env` configurado:

```powershell
npm run dev
```

`STORAGE_MODE=dynamodb` es el valor predeterminado. Si falla AWS, la API responde un error: **nunca cambia automáticamente a memoria**. El modo de memoria se rechaza cuando `NODE_ENV=production`.

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto de Express; 3000 por defecto. Render lo proporciona. |
| `NODE_ENV` | `development`, `test` o `production`. |
| `STORAGE_MODE` | `dynamodb` por defecto; `memory` solo para desarrollo explícito. |
| `AWS_REGION` | Región de la tabla. |
| `DYNAMODB_TABLE` | Nombre de la tabla. |
| `AWS_PROFILE` | Perfil local opcional; no configurarlo en Render. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Credenciales del servidor cuando no se usa perfil u otro proveedor del SDK. |
| `AWS_SESSION_TOKEN` | Necesario si las credenciales son temporales; renovar al vencer. |
| `DEMO_USER`, `DEMO_PASSWORD` | Acceso HTTP Basic de evaluación; contraseña de al menos 12 caracteres. Obligatorios juntos en producción, opcionales en local. |

El acceso de evaluación es un usuario compartido que solicita el propio navegador. No es un sistema de cuentas ni roles. Su propósito es limitar el acceso a la demostración; se comparte por un canal privado y se usa sobre el HTTPS de Render. No debe incluirse en el código, en el README público ni en la URL. Si se activa en desarrollo, abrir primero `/api/config` en el origen del frontend para que el navegador solicite las credenciales.

## Compilar y servir front y back juntos

```powershell
npm run build
npm start
```

Abrir [http://localhost:3000](http://localhost:3000). Express entrega `frontend/dist` y la API bajo `/api` desde un solo origen. `npm start` usa la configuración de `backend/.env`; para probar este empaquetado en memoria local, establecer `STORAGE_MODE=memory` y mantener `NODE_ENV=development`.

## Desplegar en Render

Primero verificar la app con DynamoDB real. Tener la tabla y el acceso IAM listos; **Render no crea DynamoDB**.

1. Subir el repositorio a GitHub, incluyendo `package-lock.json`, excluyendo `.env` y `node_modules`.
2. En Render, crear un **Blueprint** y conectar el repositorio. Render leerá [render.yaml](render.yaml).
3. Revisar el plan gratuito, nombre del servicio, región de AWS y nombre de tabla.
4. Completar `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `DEMO_USER` y `DEMO_PASSWORD` en Render. Si se usan credenciales temporales, agregar también `AWS_SESSION_TOKEN` y prever su renovación.
5. Desplegar. El comando de construcción es `npm ci --include=dev && npm run build`; el de inicio, `npm start`. La raíz del servicio es la raíz del repositorio, no `backend` ni `frontend`.
6. Abrir la URL HTTPS, introducir el acceso de evaluación y completar el recorrido de prueba indicado abajo.
7. Sustituir “URL pública: pendiente” al inicio de este README por el enlace real.

También puede crearse un Web Service manual con los mismos comandos y variables. `/health` es una sonda pública de proceso, **no verifica la conexión con DynamoDB**; comprobar la base con una operación real de la aplicación. [Blueprints de Render](https://render.com/docs/blueprint-spec).

La primera apertura puede tardar aproximadamente un minuto o más si Render debe reactivar el servicio gratuito tras 15 minutos sin tráfico. El profesor no necesita instalar herramientas ni tener cuenta AWS para probar la URL. [Condiciones de Render](https://render.com/docs/free).

## Recorrido de evaluación

1. Abrir la URL y usar el acceso compartido de evaluación; esperar si Render está reactivándose.
2. Consultar los casos ficticios cargados previamente.
3. Registrar una solicitud con documento ficticio que incluya ceros iniciales.
4. Abrir “Ver / editar”, comprobar los atributos y modificar las observaciones.
5. Cambiar el estado a “En atención” o “Atendida” y probar el filtro.
6. Recargar y volver a consultar. En la consola AWS, verificar el ítem por su `solicitudId` en **Explorar elementos**.
7. Para verificar independencia del proceso, reiniciar el backend durante una prueba controlada y comprobar que DynamoDB conserva el registro.

## Verificación y límites

```powershell
npm test
npm run build
```

Las pruebas automatizadas verifican el contrato HTTP, validaciones, metadatos, paginación, errores, acceso de evaluación y las condiciones enviadas al SDK. Usan memoria y un cliente simulado; **no certifican una conexión real con AWS**.

Alcance inicial: registrar, listar, consultar, editar y cambiar estado. No hay eliminación, mapas, archivos adjuntos, notificaciones ni gestión de usuarios. Los estados pueden cambiarse en cualquier dirección. La última edición prevalece en cambios concurrentes del mismo campo; no hay control de versiones.

### Problemas frecuentes

- **`access-analyzer:ValidatePolicy` denegado por una SCP al editar IAM:** la sesión no puede ejecutar el análisis de la política. No equivale a un error de sintaxis del JSON ni demuestra que DynamoDB esté bloqueado. Comprobar que la política se guardó y está adjunta al usuario; verificar luego el acceso con una operación real. Un permiso IAM adicional no anula una denegación explícita de la organización. Si se necesita esa acción, debe revisarla el administrador de la organización. El `us-east-1` del mensaje de Access Analyzer no cambia la región `us-east-2` de la tabla.
- **Error de almacenamiento:** revisar región, nombre de tabla, credenciales y permisos; no probar con memoria y presentarlo como DynamoDB.
- **403 de AWS o `AccessDeniedException`:** verificar la política sobre el ARN exacto de la tabla.
- **Credenciales vencidas:** renovar también `AWS_SESSION_TOKEN` si corresponde.
- **El frontend no aparece en el puerto 3000:** ejecutar `npm run build` antes de `npm start`.
- **Puerto 5173 ocupado:** cerrar la otra instancia de Vite; se usa un puerto fijo para evitar confusión.
- **Backend en otro puerto:** actualizar el proxy en `frontend/vite.config.js`.
- **Página sin coincidencias y botón “Cargar más”:** es normal al filtrar un `Scan`; continuar para revisar las siguientes páginas.

Al terminar la evaluación, acordar con el grupo la conservación de los datos antes de eliminar recursos. Si ya no se necesitan, eliminar el servicio en Render y la tabla en AWS, y revocar las credenciales dedicadas. No hay script de borrado automático.
