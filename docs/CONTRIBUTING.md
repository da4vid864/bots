# Contributing Guide

Thank you for your interest in contributing to the project! This guide details the standards and workflows we follow.

## Development Workflow

1.  **Fork & Clone**: Fork the repository and clone it locally.
2.  **Branching**: Create a new branch for your feature or fix.
    *   `feature/my-new-feature`
    *   `fix/bug-description`
    *   `docs/update-readme`
3.  **Changes**: Make your changes, ensuring you follow the coding standards below.
4.  **Commit**: Commit your changes with clear, descriptive messages.
5.  **Push & PR**: Push to your fork and submit a Pull Request to the `main` branch.

## Coding Standards

### General
*   Write clean, readable, and maintainable code.
*   Follow the existing project structure.
*   Keep functions small and focused.

### JavaScript (Backend & Frontend)
*   **Linting**: We use ESLint. Ensure your code passes all linting rules before committing.
*   **Formatting**: We use Prettier. Run prettier on your files to ensure consistent formatting.
*   **Variable Naming**: Use `camelCase` for variables and functions. Use `PascalCase` for React components and classes.
*   **Async/Await**: Prefer `async/await` over raw Promises where possible.

### Commit Messages
We follow the Conventional Commits specification:

*   `feat: add new login page`
*   `fix: resolve crash on startup`
*   `docs: update API documentation`
*   `style: format code with prettier`
*   `refactor: simplify auth logic`
*   `test: add unit tests for user service`

## Pull Request Guidelines

*   Provide a clear description of the changes.
*   Link to any related issues.
*   Ensure all tests pass.
*   Review your own code before submitting.

## Reporting Issues

If you find a bug or have a feature request, please open an issue in the issue tracker providing as much detail as possible.