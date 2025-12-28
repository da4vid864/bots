# Guía de Contribución

¡Gracias por tu interés en contribuir al proyecto! Esta guía detalla los estándares y flujos de trabajo que seguimos.

## Flujo de Trabajo de Desarrollo

1.  **Fork & Clonar**: Haz un fork del repositorio y clónalo localmente.
2.  **Branching**: Crea una nueva rama (branch) para tu funcionalidad o corrección.
    *   `feature/mi-nueva-funcionalidad`
    *   `fix/descripcion-del-bug`
    *   `docs/actualizar-readme`
3.  **Cambios**: Realiza tus cambios, asegurándote de seguir los estándares de código a continuación.
4.  **Commit**: Haz commit de tus cambios con mensajes claros y descriptivos.
5.  **Push & PR**: Sube (push) los cambios a tu fork y envía un Pull Request a la rama `main`.

## Estándares de Código

### General

*   Escribe código limpio, legible y mantenible.
*   Sigue la estructura existente del proyecto.
*   Mantén las funciones pequeñas y enfocadas.

### JavaScript (Backend & Frontend)

*   **Linting**: Usamos ESLint. Asegúrate de que tu código pase todas las reglas de linting antes de hacer commit.
*   **Formato**: Usamos Prettier. Ejecuta Prettier en tus archivos para garantizar un formato consistente.
*   **Nombres de Variables**: Usa `camelCase` para variables y funciones. Usa `PascalCase` para componentes React y clases.
*   **Async/Await**: Prefiere `async/await` sobre Promises (promesas) donde sea posible.

### Mensajes de Commit

Seguimos la especificación de Conventional Commits:

*   `feat: agregar nueva página de inicio de sesión`
*   `fix: resolver fallo al inicio de la aplicación`
*   `docs: actualizar la documentación de la API`
*   `style: formatear el código con prettier`
*   `refactor: simplificar la lógica de autenticación`
*   `test: agregar pruebas unitarias para el servicio de usuario`

## Guía para Pull Requests (PR)

*   Proporciona una descripción clara de los cambios.
*   Enlaza a cualquier issue relacionada.
*   Asegúrate de que todas las pruebas pasen.
*   Revisa tu propio código antes de enviarlo.

## Reportar Issues

Si encuentras un bug o tienes una solicitud de funcionalidad, por favor, abre un issue en el issue tracker proporcionando tantos detalles como sea posible.