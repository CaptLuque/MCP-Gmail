# Gmail MCP Server

    Un servidor MCP (Model Context Protocol) para interactuar con Gmail usando autenticación OAuth 2.0.

    ## Características

    - Autenticación OAuth 2.0 con la API de Gmail
    - Gestión de correos (enviar, buscar, mover a papelera, eliminar)
    - Gestión de etiquetas (crear, añadir, eliminar)
    - Visualización de hilos de conversación
    - Gestión de estado de correos (leído/no leído)
    - Información de perfil de usuario

    ## Instalación

    ```bash
    npm install
    ```

    ## Configuración

    1. Crea un proyecto en Google Cloud Console y habilita la API de Gmail:
       - Ve a [Google Cloud Console](https://console.cloud.google.com)
       - Crea un nuevo proyecto
       - Habilita la API de Gmail
       - Crea credenciales de ID de cliente OAuth (tipo aplicación web)
       - Configura la URI de redirección a `http://localhost:3000/oauth2callback`
       - Descarga el JSON y guárdalo como `credentials/credentials.json` en este proyecto

    2. Autentícate con Gmail:
       ```bash
       npm run auth
       ```
       Esto abrirá una ventana del navegador para que autorices la aplicación.

    ## Uso

    ### Modo CLI (stdio)

    ```bash
    npm start
    ```

    ### Modo HTTP

    ```bash
    npm run http
    ```

    ### Con Inspector MCP para pruebas

    ```bash
    npm run inspect
    ```

    ## Opciones de Despliegue

    Consulta el archivo `deploy-instructions.md` para obtener instrucciones detalladas sobre cómo desplegar este servidor MCP en diferentes entornos.

    ## Herramientas Disponibles

    - `send_email`: Enviar un correo electrónico a través de Gmail
    - `search_emails`: Buscar correos usando la sintaxis de búsqueda de Gmail
    - `create_label`: Crear una nueva etiqueta en Gmail
    - `add_labels`: Añadir etiquetas a un correo
    - `remove_labels`: Eliminar etiquetas de un correo
    - `trash_email`: Mover un correo a la papelera
    - `untrash_email`: Restaurar un correo desde la papelera
    - `delete_email`: Eliminar permanentemente un correo
    - `mark_as_read`: Marcar un correo como leído
    - `mark_as_unread`: Marcar un correo como no leído
    - `get_thread`: Obtener todos los correos en un hilo
    - `get_profile`: Obtener información del perfil de usuario

    ## Recursos Disponibles

    - `gmail://emails/{label}`: Obtener correos por etiqueta
    - `gmail://email/{id}`: Obtener un correo específico por ID
    - `gmail://labels`: Obtener todas las etiquetas

    ## Licencia

    MIT
