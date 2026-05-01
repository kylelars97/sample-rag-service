# Coding Standards

## Style

- Use camelCase for variables and functions
- Use PascalCase for classes, interfaces, and types
- Prefer named exports over default exports
- Use explicit type annotations for function parameters and return types
- Always include explicit return types on functions for clarity and to prevent unintended return type changes
- Avoid `any` type; use `unknown` if the type is truly unknown
- Use `const` by default, `let` when reassignment is necessary, avoid `var`
- Keep lines concise and readable; aim for clarity over brevity
- Use `readonly` for immutable properties and arrays to enforce immutability and catch accidental mutations
- Use union types or enums instead of magic strings and numbers to improve type safety
- Use type guards and discriminated unions to enable better type narrowing and exhaustiveness checking
- Avoid mutable global state to promote testability and reduce hidden dependencies
- Enforce strict TypeScript compiler options (strict, noImplicitAny, strictNullChecks, etc.) for stronger type checking
- Use proper async/await patterns with explicit Promise typing to ensure clarity around asynchronous operations

## Testing

- Test coverage should be near the theoretical limit; use coverage tools to measure and track
- Use mutation testing (Stryker) to refine tests and ensure quality
- Use descriptive test names following the format: `MethodUnderTest_ActionBeingTested_ExpectedResult`
- Run all tests in parallel when possible to optimize test suite performance
- Follow the Arrange-Act-Assert (AAA) pattern for test structure
- Avoid repetitive tests; if multiple tests are identical in structure, collapse them into one test with multiple test cases
- Every public function and exported class should have at least one test

## Architecture

- Design deep modules with simple APIs for callers; hide complexity in implementation
- Follow SOLID principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
- Minimize comments in code; write readable, self-documenting code instead
- Prioritize readable code while maintaining conciseness; clarity is preferred over being overly brief
- Prefer composition over inheritance for code reusability and flexibility
- Enforce separation of concerns; each module should have a single, well-defined responsibility
- Use dependency injection to promote modularity, testability, and loose coupling between components
- Ensure modules have clearly defined boundaries with no overlapping responsibility or functionality
