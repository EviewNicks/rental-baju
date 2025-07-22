# Lint and Type Check Command

Run comprehensive code quality checks and fix issues automatically.

## Task Overview
1. Run ESLint to identify and fix code style issues
2. Run TypeScript type checking to catch type errors
3. Provide clear feedback on remaining issues
4. Suggest fixes for complex problems

## Execution Steps

### Step 1: Run ESLint with auto-fix
```bash
yarn lint:fix
```

### Step 2: Run TypeScript type checking
```bash
yarn type-check
```

### Step 3: Analyze and resolve issues
- Review any remaining lint errors that couldn't be auto-fixed
- Identify type errors and their root causes
- Provide specific fixes for each issue
- Prioritize critical errors first

### Step 4: Verify fixes
- Re-run lint and type check to confirm resolution
- Run relevant tests to ensure no regressions
- Provide summary of all changes made

## Common Issue Patterns
- **Unused imports/variables**: Auto-removable with lint:fix
- **Type mismatches**: Require manual intervention
- **Missing return types**: Add explicit type annotations
- **Async/await issues**: Fix promise handling
- **Component prop types**: Add proper TypeScript interfaces

## Success Criteria
- All lint errors resolved or suppressed with justification
- All type errors fixed
- No regressions in existing functionality
- Code follows project conventions from CLAUDE.md