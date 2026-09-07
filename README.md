# Gestión de solicitudes de asistencia por sismos usando DynamoDB

## Taller de Electiva de Bases de Datos Modernas. 

Aplicación para registrar solicitudes de personas afectadas por sismos y realizar seguimiento a su atención.

**Estado:** La aplicación cuenta con frontend y backend implementados, utiliza la tabla `SolicitudesAsistencia` creada en AWS DynamoDB, y fue publicada en Render.

**URL pública:** [https://asistencia-sismos.onrender.com/](https://asistencia-sismos.onrender.com/)

**Integrantes:** Cristian Eslava, Alisson Páez, David Sanchez, Karolain Giraldo, Angel Castro.

**Documento para entender la estrcutura proyecto:** [API](docs/API.md).

---

## Arquitectura
El usuario puede acceder a la aplicación desde el navegador, ya que está publicada en Render, donde funcionan tanto el backend como el frontend. El backend se conecta a DynamoDB para guardar y consultar las solicitudes.

- El frontend fue desarrollado con React, Vite, JavaScript y CSS. 
- El backend fue desarrollado con Node.js y Express, utiliza Zod para validar los datos y el SDK v3 de AWS para conectarse con DynamoDB.
- El backend genera automáticamente el identificador único (UUID) y las fechas de seguimiento de cada solicitud.
---

## DynamoDB: Explicación del modelo y las decisiones tomadas
Se creó una tabla llamada `SolicitudesAsistencia`, con clave de partición `solicitudId` de tipo `String`. Esta clave es un campo que usa DynamoDB para identificar cada solicitud.

 La tabla almacena datos como nombre, documento, teléfono, municipio, dirección, tipo de ayuda, magnitud del sismo, estado y fechas de seguimiento. Cada registro de la tabla representa una solicitud de asistencia. Una misma persona puede aparecer en varias solicitudes, por lo que el documento no es único.


### Decisiones de construcción 
Se utiliza una sola tabla porque en el contexto existe una sola entidad principal: solicitud de asistencia. Cada solicitud contiene la información de la persona afectada, los datos del sismo y su estado de atención. De esta forma, todo queda organizado en un mismo ítem o registro. 

Cada solicitud tiene un identificador unico llamado `solicitudId`, que se genera automáticamente por el backend por medio de un UUID. Este identificador permite consultar y actualizar una solicitud sin depender del nombre o del documento de la persona. Además, no se usa clave de ordenamiento porque cada solicitud es independiente y no se agrupan varios registros con una misma clave. 


### Operaciones principales

| Acción en la aplicación| Operación DynamoDB | Función |
| --- | --- | --- |
| Registrar una solicitud | `PutCommand` | Inserta el registro usando `attribute_not_exists(solicitudId)` para no sobrescribir un UUID que ya existe. |
| Consultar una solicitud | `GetCommand` | Busca la solicitud por medio de su `solicitudId`. |
| Editar una solicitud o cambiar su estado | `UpdateCommand` | Actualiza solo los atributos recibidos de una solicitud existente.|
| Listar solicitudes | `ScanCommand` | Obtiene las solicitudes y les aplica filtros mediante `FilterExpression`. |

El backend usa `DynamoDBDocumentClient` de `@aws-sdk/lib-dynamodb` para comunicarse con DynamoDB por medio de objetos de JavaScript. Para listar las solicitudes se usa `Scan`, ya que la aplicación necesita revisar varios registros y no conoce la `solicitudId` de cada uno. Esta solución es la más adecuada. 

### Atributos almacenados

| Atributo | Tipo de dato | Descripción |
| --- | --- | --- |
| `solicitudId` | String | UUID generado por el backend y clave primaria. |
| `nombre` | String | Obligatorio, 2–120 caracteres. |
| `documento` | String | Obligatorio, 3–30 caracteres. No elimina ni modifica ceros iniciales y letras. |
| `telefono` | String | Obligatorio, 7–25 caracteres. Admite dígitos, espacios, `+`, paréntesis y guiones. |
| `municipio` | String | Obligatorio, 2–100 caracteres. |
| `direccion` | String | Obligatoria, 3–200 caracteres. |
| `fechaSismo` | String | Fecha real `YYYY-MM-DD`. |
| `fechaSolicitud` | String | Generado al crear, no cambia. |
| `magnitud` | Number o Null | Opcional, 0–10. Si se desconoce se guarda como `null`, no como 0. |
| `tipoAyuda` | String | `ALIMENTACION`, `ALOJAMIENTO`, `ATENCION_MEDICA`, `RESCATE` u `OTRA`. |
| `estado` | String | `PENDIENTE`, `EN_ATENCION` o `ATENDIDA`. Inicialmente queda en `PENDIENTE`. |
| `observaciones` | String | Opcional, máximo 1500 caracteres. Por defecto es una cadena vacía. |
| `fechaActualizacion` | String | Se actualiza al editar o cambiar estado. |

---

## Preguntas comparativas

### 1. ¿Cómo se definen las reglas en DynamoDB?
En DynamoDB lo que se define como base es la clave primaria de la tabla y si se necesitan, también los índices secundarios para consultas más específicas. No se obliga a crear columnas fijas desde el inicio como lo hacen las bases de datos relacionales. En vez de eso se usa el modelo por item:

Un item en DynamoDB es un objeto JSON que contiene una clave principal y sus atributos, por ejemplo:

```powershell
{
  "solicitudId": "1",
  "nombre": "María",
  "direccion": "Barrio San Antonio",
  "estado": "PENDIENTE"
}
```
Cada item puede almacenar atributos diferentes según su caso, no es obligatorio que todos los items tengan los mismos campos. Esto es muy útil para atributos opcionales. Por eso, la validación de los tipos de datos, los campos obligatorios y los formatos y reglas de negocio se hacen normalmente en la aplicación. DynamoDB también permite usar condiciones en las operaciones para evitar sobreescribir o modificar los datos de forma incorrecta. 

### Demostración de esto en la aplicación
Al crear la tabla, solo se define `solicitudId` como clave principal. Los demás atributos no se crean como columnas fijas desde el inicio, sino que se agregan como atributos a cada ítem cuando se guarda una solicitud, esto permite que hayan registros con atributos opcionales. 

El backend valida que la información cumpla las reglas antes de guardarla. 


### 2. ¿Cómo es la seguridad en DynamoDB?

La seguridad en DynamoDB se administra principalmente mediante AWS IAM, que define qué usuarios o servicios pueden acceder a las tablas y qué operaciones pueden realizar. También se pueden proteger los datos por medio de cifrado, utilizando conexiones seguras y aplicando políticas de control de acceso.


### 3. Ventajas y Desventajas con Firebase teniendo en cuenta el ejercicio

**Ventajas**
- Se integra con los servicios de AWS.
- Permite controlar los permisos por medio de IAM.
- Es flexible para almacenar datos con diferentes atributos.
- Puede ser más rentable para proyectos con crecimiento. 

**Desventajas**
- Requiere más conocimientos de AWS y configuración inicial.
- Las consultas deben planearse según las claves e índices.
- Puede ser más complejo para proyectos pequeños.
- No ofrece de forma predeterminada la misma sincronización en tiempo real que Firebase.

En conclusión, DynamoDB es una mejor opción para proyectos que tengan mayor crecimiento, mayor volumen de datos o más complejidad técnica, mientras que Firebase es más práctico para proyectos pequeños o con requisitos más sencillos. 

---
## Uso de la aplicación 
La aplicación permite registrar solicitudes de asistencia por sismos y llevar un seguimiento en cada caso.

### Funcionalidades principales
- Registrar una nueva solicitud con datos como nombre, documento, municipio, dirección, tipo de ayuda, fecha del sismo y magnitud.
- Consultar las solicitudes existentes.
- Ver el detalle de una solicitud registrada.
- Actualizar observaciones y cambiar el estado de atención.
- Filtrar o buscar solicitudes por cierta información

### Forma de usarla
- Completar el formulario con los datos de la persona afectada.
- Guardar la solicitud.
- Revisar la lista de casos registrados.
- Seleccionar una solicitud para consultar o editar su información.
- Cambiar el estado según el avance del caso.


---
## Guía opcional de replicación del entorno con AWS DynamoDB

Esta sección es opcional y solo aplica si se desea replicar el proceso en otra cuenta de AWS.

### Creación de la tabla en AWS

La tabla del proyecto está creada y activa en Ohio (`us-east-2`) y es la misma que usa el backend y Render para conectarse a la base de datos. Para reproducirla en otra cuenta de AWS solo se debe crear una tabla llamada `SolicitudesAsistencia` con la clave principal `solicitudId` de tipo String, sin clave de ordenamiento.  


### Ejecución con DynamoDB

Primero se edita el archivo `backend/.env` con la región, el nombre de la tabla y las credenciales necesarias para la conexión.

Con la tabla creada y el archivo configurado se inicia la aplicación con:

```powershell
npm run dev
```
`STORAGE_MODE=dynamodb` es el valor predeterminado. Si AWS falla, la API responde con un error.

---

## Conclusión
Este proyecto demuestra cómo DynamoDB puede hacer más fácil la gestión de información cambiante y escalable en una aplicación como la de asistencia a sismos, permitiendo almacenar cada solicitud como un item independiente y flexible, mientras la validación y las reglas de negocio se mantienen en la aplicación.
