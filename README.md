# Webapp de inscripción a talleres

Una aplicación web altamente parametrizable construida con **Google Apps Script** para gestionar inscripciones a eventos y talleres de forma eficiente, segura y sin necesidad de conocimientos de programación para su gestión diaria.

Este proyecto permite transformar una hoja de cálculo de Google en un completo sistema de reservas con control de aforo en tiempo real, validación de identidad y notificaciones automáticas por correo electrónico.

## 🚀 Características principales

- **Gestión desde Google Sheets:** Todo el contenido (textos, imágenes, colores, periodos de apertura) se configura desde una pestaña de la hoja de cálculo.
- **Control de aforo (concurrencia segura):** Utiliza `LockService` para garantizar que no se sobrepasen las plazas disponibles, incluso con cientos de usuarios accediendo simultáneamente.
- **Interfaz dinámica:** Generación automática de pestañas y selectores según los grupos de talleres definidos en la base de datos.
- **Validación de identidad:** Permite restringir el acceso comparando los datos introducidos con una tabla de usuarios autorizados.
- **Inscripciones múltiples/actualización:** Configurable para impedir duplicados o permitir que los usuarios modifiquen su selección previa.
- **Notificaciones por email:** Envío automático de confirmaciones con los talleres seleccionados mediante plantillas HTML personalizables.
- **Diseño responsive:** Interfaz basada en Materialize CSS optimizada para dispositivos móviles y escritorio.

## 🛠️ Configuración y uso

1. **Estructura de la hoja de cálculo:** La aplicación requiere pestañas específicas denominadas `Configuración`, `Talleres`, `Inscripciones` e `Identificación`.
2. **Parametrización:** Desde la hoja `Configuración` se pueden definir:
    - Periodos de apertura y cierre automáticos.
    - Imagen y textos de encabezado.
    - Colores del tema (Material Design).
    - Expresiones regulares para validar campos de entrada (DNI, Email, códigos, etc.).
3. **Gestión de talleres:** En la hoja `Talleres` se definen los nombres, grupos (franjas horarias), aforo máximo y enlaces a fichas informativas.
4. **Despliegue:** Se debe desplegar como **Aplicación web** con acceso para "Cualquier persona" (o restringido a un dominio Workspace).

## 💻 Requisitos técnicos

- Cuenta de Google (Personal o Workspace).
- Google Apps Script (entorno de ejecución V8).
- Google Sheets como base de datos y panel de control.

---

## 🤝 Créditos

Este proyecto ha sido creado y es mantenido por **Pablo Felip** ([LinkedIn](https://www.linkedin.com/in/pfelipm/) | [GitHub](https://github.com/pfelipm)).

Diseñado para **GEG Spain** / [**Transformación Educativa**](https://transformacioneducativa.es/).

## 📄 Licencia

Este proyecto se distribuye bajo los términos del archivo [LICENSE](LICENSE).
