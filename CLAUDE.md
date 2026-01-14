# Development Guidelines

## General Guidance

- If you're unclear about the request, break it down, make a plan, and gather more information as needed—via tool calls, clarifying questions, etc. Don't write code until you're 95%+ confident in the plan. Act like a senior engineer: anticipate edge cases, dependencies, and sequencing
- For example, if you've performed a semantic search, and the results may not fully answer the USER's request, or merit gathering more information, feel free to call more tools
- If you've performed an edit that may partially satiate the USER's query, but you're not confident, gather more information or use more tools before ending your turn
- Bias towards not asking the user for help if you can find the answer yourself
- Stay focused on the task. Do not go beyond its scope—even if you notice unrelated type errors or test failures

## Project Architecture

This is a TypeScript-first monorepo with a domain-driven architecture designed for scalability and maintainability.

### Package Organization

- **Core Package**: Foundational utilities, types, and collections. Can be used in any other package
- **Domain Package**: Business logic, data models, and domain services independent of delivery mechanisms. Cannot be used in the frontend package
- **Frontend Package**: React-based user interface components and client-side logic
- **Functions Package**: AWS Lambda functions for serverless backend operations
- **Scripts Package**: Automation scripts, data migration tools, and development utilities

### Architectural Principles

- **Domain-Driven Design**: Business logic is centralized in the domain package, isolated from UI and infrastructure concerns
- **Dependency Direction**: Dependencies flow inward toward the core and domain packages; outer packages depend on inner ones but not vice versa
- **Shared Tooling**: Common build tools, linting, formatting, and testing configurations are shared across all packages
- **Multi-Language Support**: Primarily TypeScript with Go for performance-critical functions

### Infrastructure as Code

- All cloud infrastructure is defined using SST (Serverless Stack Toolkit)
- Infrastructure is organized by domain with reusable components and helpers
- Environment-specific configurations support multiple deployment targets
- Step Functions state machines for complex workflows
- Main entry point: `sst.config.ts` in project root
- When using documentation tools for SST:
  - Use library ID `/sst/sst` (this is the main SST v3+ library, not `/sst/v2`)
  - Always specify the exact version when possible if documentation supports it
  - Focus searches on the specific SST component you're working with (e.g., "DynamoDB", "Function", "Bucket")
- **Structure**:
  - `infra/formations/` - Main resource definitions organized by domain (auth, data, frontend, etc.)
  - `infra/helpers/` - Shared utilities (permissions, lambda config, bucket config)
  - `infra/components/` - Reusable SST components (queued functions, state machines)
  - `infra/machines/` - Step Functions state machine definitions
  - `infra/config.ts` - Stage configuration, accounts, and environment settings
  - `infra/dns.ts` - Domain and DNS configuration
- SST resources are linked to functions and can be accessed via `Resource.ResourceName.property`

### Dependency Management

- Uses pnpm workspaces for efficient package management
- Catalog-based dependency versioning is used to ensure consistent versions across packages
- Catalog-based dependency versioning is used for AWS SDK, development tools, common utilities, and any package used within multiple packages

## Development Commands

### Build and Lint

- Use `pnpm typecheck` to typecheck the overall project
  - Prefer `pnpm --filter foo exec tsc --noEmit` if you want to typecheck a single package
  - If type errors are only required from a few files, prefer using file-level diagnostics and tools for better performance and specificity
- Typecheck Go only: `pnpm go:checks`
- Lint: `pnpm lint` (fixes issues) or `pnpm check:ci` (reports only)
- Format: `pnpm format` (fixes issues). Use this to fix formatting issues
- If you're running a standalone JS or TS script (e.g. a script to test and log something), run it using `bun` which will be available globally

### Testing

We use vitest for testing. Start all your test commands with `pnpm test:claude`. This ensures you get plain text output with no colors.

#### Running Tests

We have a lot of tests:

- Always target specific tests, test files, or directories when possible
  - Run single test: `pnpm test:claude packages/path/file.spec.ts` or `pnpm test:claude -t "test name"`
- Filter out unnecessary output. For example:
  - Use `--silent` to suppress noisy console logs. If you want console logs, make sure you are targetting specific tests
  - Append ` | grep $'^\u2713'` to filter out tests that pass. Always use this if you only want to know which tests are failing

#### Testing Strategy

- Unit tests with vitest for fast feedback loops
- Integration tests for cross-package functionality
- Dependency injection patterns to enable comprehensive testing without mocks
- Test utilities and fixtures shared across packages

#### Test Structure and Patterns

- Use Vitest for tests (`describe`, `it`, `expect` pattern)
- Test files follow specific suffixes:
  - Unit tests: `*.spec.ts`
  - Integration tests: `*.integration.ts`
- Test organization:
  - Organize constants at the top
  - Organize test setup at the bottom (helper functions)
  - Group related tests (e.g. for a particular function or class) in `describe` blocks with clear scope. Do not add a describe block for the module
  - Write descriptive test names using `it("should...")`
  - Use helper functions to create test fixtures
  - Use `it.each()` for parameterized tests to reduce duplication and improve readability
  - Add comments for test cases that need explanation. Do NOT add redundant comments (e.g. "Execute", "Verify", "Should succeed"). Avoid obvious comments like "// Check the result" or "// Verify X worked"
  - Do not test log functionality unless it's the primary purpose of the code being tested
- Prefer using global test data if possible, e.g. from `**/testing/samples/*.ts` files
- We don't test React components or anything that uses JSDom on the frontend. Pure hooks or helper functions can be tested though

#### Dependency Injection in Tests

- **Prefer dependency injection** over module mocking
- Design components and functions to accept dependencies as parameters
- Avoid mocking entire modules or using `vi.mock()` when possible
- For interfaces/classes that need mocking, use `mock<Interface>()` from vitest-mock-extended
- Create factory functions for complex test objects
- Use snapshots (inline if small enough) for complex object validation
- If you notice a bug while writing tests, write a failing test to reproduce the issue and fix it
- Again do not write tests for obvious bugs. Think about and respect the intention of the code

## Documentation Retrieval

- Check installed package versions first: `pnpm list <package-name> --recursive` to get exact versions used in the monorepo
- For questions about specific libraries, packages, or frameworks, prefer using `resolve-library-id` and `get-library-docs` with the specific version when possible
- Use the exact version from pnpm list (e.g., if `date-fns 4.1.0` is installed, look for `/date-fns/4.1.0` documentation)
- If documentation tools are not available, use `web_search` or `fetch` to find current documentation from official sources
- This ensures answers reflect the exact API version used in the project

## Coding Guidelines

In general, existing coding styles (e.g. the module you're working in) take precedence over these guidelines, unless you're rewriting something and there's an obvious cleanup opportunity. Although make sure you don't go beyond the scope of the task at hand.

### Basic Style Rules

- TypeScript is strongly encouraged with strict typing
- Indent: 2 spaces
- Max line width: 88 characters
  - Ensure comments (including the comment prefix) and docstrings wrap at 88 characters
- Imports: Use absolute imports with @ aliases when possble:
  - Common across packages: `@core/`, `@domain/`
- Naming: camelCase for variables/functions, PascalCase for classes/interfaces
- Use functional patterns and immutability when appropriate
- Do not create long functions. Break out helper functions and put them at the bottom of the module instead
- *Never* use barrel modules (e.g. `index.ts` files that re-export other modules). Try to avoid creating `index.ts` modules in general
- Be smart when writing comments. Avoid comments that simply repeat the code. If a piece of code is not obvious, add a comment justifying why it's necessary

### TypeScript Typing

- Model all possible states explicitly
- NEVER use `any` or non-null assertions (`!`) outside of tests unless you have no other option. If used, a comment defending and explaining its usage is required. The comment should also explain why the usage is safe

### Error Handling

- If a function returns a success/fail response, consider using `Result`
- If you're calling an async function that might throw an error, consider using `tryCatch`
- Use custom error classes from `@core/errors` for specific error types: `ConfigurationError`, `ValueError`, `NotImplementedError`, `TimeoutError`

### Collection Classes

- Use `BetterMap` instead of `Map` for enhanced functionality (getOrThrow, setOrThrow, filter, map, etc.)
- Use `DefaultMap` for maps that need default values for missing keys
- Use specialized collections: `CountMap`, `BoundedQueue`, `FIFOQueue`, `Cache` when appropriate
- Collections provide functional methods (filter, map, reduce) - prefer these over manual iteration

### Database Schema (Drizzle)

- Schema files are located in `packages/domain/postgres/schema/`
- Each table has its own file exporting the table definition and inferred types
- **NEVER manually create migration files** - only edit the Drizzle schema files
- After schema changes, inform the user they need to generate migrations (the user will run the migration generation command themselves)
- Use `Pick<TableType, "field1" | "field2">` to derive types from schema instead of manually duplicating field types
- Export both the table and inferred types: `export type Foo = typeof fooTable.$inferSelect;`

### Schema Validation (Zod)

- Use Zod transformers for data conversion
- Export both the schema and the inferred type: `export const fooSchema = z.object(...); export type Foo = z.infer<typeof fooSchema>;`
- Use `z.nativeEnum()` for TypeScript enums in schemas

### Lambda/Function Patterns

- Lambda handlers should be based on subclasses of specific handler classes. For example:
  - `AbstractSfHandler` for Step Function Lambdas
  - `AbstractSQSHanlder` for SQS Lambdas
- Note that each API only uses a single Lambda with a Hono API
- Use structured logging with `Logger` class, not `console.log`

### Configuration Management

- Separate feature flags (`features.ts`) from operational settings (`settings.ts`)

### Performance and Memory

- Use streaming patterns for large file processing
- Prefer functional array methods over manual loops for readability
- Use `Set` and `Map` for O(1) lookups instead of array searching

### Frontend Components

Prefer to re-use existing components when possible, and to follow existing styles and patterns. Notably, use the `shadcn-ui` library for UI components. Already installed components are available in `frontend/src/components/ui`. They may be modified as needed. If you want to use a new shadcn component, you can install it via the shardcn CLI by running `pnpm shadcn` in the frontend package. Feel free to make minor adjustments to the installed components as needed (e.g. some styles).

### Using 3rd Party Packages

In situations where a solution would involve either:
- A complex algorithm that is difficult to implement manually
- A significant amount of code that would be difficult to maintain
We prefer to search for and use 3rd party packages from NPM.

In situations like these, try searching for reputable NPM packages that we could use instead. We prefer packages that:
- Are actively maintained
- Have a good documentation and examples
- Have a good test coverage
- Have a good community support
But we are not limited to these criteria. If you think a package if a good fit, stop the task and ask the user if they'd like to use it. Provide a reason for your choice, and a link to the package.

When using a package, it should almost never be added to the root `package.json`. Instead, add it to the specific package's `package.json` file (e.g. `packages/core/package.json`).

## Advanced Patterns

### Handling Repetitive Changes

- Preview changes: `sed 's/oldPattern/newPattern/g' file.ts`
- Apply changes: `sed -i 's/oldPattern/newPattern/g' file.ts`
- Apply changes to multiple files: `find packages/domain -name "*.ts" -exec sed -i 's/oldPattern/newPattern/g' {} +`
- For complex patterns, test the regex on a single file first

