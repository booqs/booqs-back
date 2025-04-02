# Booqs Backend Development Guide

## Commands
- **Build**: `npm run build` (TypeScript compilation & linting)
- **Develop**: `npm run dev` (runs HTTPS server with hot reload)
- **HTTP Server**: `npm run http` (development HTTP server)
- **Lint**: `npm run lint` (ESLint check)
- **Start**: `npm run start` (production server)
- **CLI**: `npm run cli` (command line interface)

## Code Style Guidelines
- **Types**: Strict typing with TypeScript, avoid `any` when possible
- **Formatting**: 
  - Single quotes for strings
  - No semicolons
  - Comma-dangle for multiline
  - 2-space indentation
- **Naming**: 
  - camelCase for variables/functions
  - PascalCase for types/interfaces
  - Descriptive names preferred
- **Imports**: Group imports by source (built-in, external, internal)
- **Error Handling**: Use explicit error types and propagate when appropriate
- **TypeScript**: 
  - Interface members use comma delimiter
  - Return types should be inferred when obvious
- **Comments**: Use JSDoc for public APIs and complex functions