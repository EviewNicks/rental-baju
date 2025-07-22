---
description: "Smart task documentation generator - automatically selects the appropriate format (UI, FE, or BE) based on task type and ensures architectural compliance"
---

# Task Documentation Generator

You are tasked with creating comprehensive task documentation for the rental software project. Based on the user's request, you must intelligently determine whether this is a UI, Frontend (FE), or Backend (BE) task and use the appropriate format template while ensuring full architectural compliance.

## Task Type Classification Logic

**UI Task Indicators:**
- **Keywords**: "design", "wireframe", "mockup", "UI/UX", "visual", "style", "layout", "responsive", "accessibility", "user interface", "component design", "design system", "style guide"
- **Focus**: Visual design, user experience, design systems, accessibility standards, design tokens, color schemes
- **Output**: Design specifications, wireframes, style guides for developers to implement
- **Architecture Layer**: Presentation Layer (visual specifications)

**FE Task Indicators:**
- **Keywords**: "component", "React", "hooks", "state", "frontend", "client-side", "browser", "form", "interaction", "API integration", "custom hook", "state management", "routing", "client logic"
- **Focus**: React components, custom hooks, state management, client-side logic, user interactions
- **Output**: UI implementation, API integration, client-side functionality
- **Architecture Layer**: Presentation Layer (components) + Logic Layer (hooks)

**BE Task Indicators:**
- **Keywords**: "API", "endpoint", "database", "server", "backend", "business logic", "data processing", "authentication", "authorization", "schema", "migration", "Prisma", "route handler"
- **Focus**: Server-side logic, database operations, API endpoints, data management, business rules
- **Output**: Data layer, API endpoints, database schemas, server-side functionality
- **Architecture Layer**: Data Layer (API routes, database)

## Architecture Integration Requirements

### For UI Tasks - Reference These Files:
1. **Design System**: `@docs/uiux-consistency.md` - UI/UX consistency guidelines and design tokens
2. **Style Tokens**: `@styles/globals.css` - CSS custom properties, color variables, and design tokens
3. **Architecture Context**: `@docs/rules/architecture.md` - Understanding of presentation layer requirements

### For FE Tasks - Reference These Files:
1. **Architecture Guidelines**: `@docs/rules/architecture.md` - Frontend structure, components, and hooks patterns
2. **Layer Compliance**: Focus on Presentation Layer (`features/[fitur]/components/`) and Logic Layer (`features/[fitur]/hooks/`)
3. **UI Integration**: Reference related UI task docs for design implementation

### For BE Tasks - Reference These Files:
1. **Architecture Guidelines**: `@docs/rules/architecture.md` - Backend structure, API routes, and data layer patterns
2. **Layer Compliance**: Focus on Data Layer (`app/api/[fitur]/route.ts`, `prisma/`)
3. **API Integration**: Consider frontend requirements for API design

## Format Application Instructions

### Step 1: Analyze the Request
Carefully read the user's request and identify:
- Primary task type (UI, FE, or BE)
- Secondary task types (if multi-type task)
- Feature context and scope
- Architectural layer implications

### Step 2: Apply Appropriate Format
**For UI Tasks:**
```
Apply format from: @docs/rules/format-ui.md
Key sections to emphasize:
- Reference Visual & Inspirasi (include @docs/uiux-consistency.md guidelines)
- Spesifikasi UI & Komponen (reference @styles/globals.css tokens)
- Design Rationale & Constraints
- Handoff Requirements (specify integration with FE tasks)
```

**For FE Tasks:**
```
Apply format from: @docs/rules/format-task-fe.md
Key sections to emphasize:
- Spesifikasi Teknis FE (align with @docs/rules/architecture.md structure)
- Komponen yang Dibutuhkan (Presentation Layer focus)
- Custom Hooks yang Dibutuhkan (Logic Layer focus)
- API Integration (interface with BE tasks)
```

**For BE Tasks:**
```
Apply format from: @docs/rules/format-task-be.md
Key sections to emphasize:
- Spesifikasi Teknis BE (align with @docs/rules/architecture.md structure)
- Database Schema Changes (Prisma focus)
- API Endpoints Design (Data Layer focus)
- Integration with Frontend requirements
```

### Step 3: Ensure Cross-References
According to `@docs/rules/task-docs-relationships.md`:

**UI Task Cross-References:**
```markdown
## Related Tasks
- **Frontend Implementation**: [Link to task-fe-xxx.md]
- **Backend Data Requirements**: [Link to task-be-xxx.md] (if needed)

## Architecture Compliance
- **Layer**: Presentation Layer (Design Specifications)
- **Output**: Design specs for `features/[fitur]/components/`
```

**FE Task Cross-References:**
```markdown
## Related Tasks
- **UI Design Reference**: [Link to task-ui-xxx.md]
- **Backend API Requirements**: [Link to task-be-xxx.md]

## Architecture Compliance
- **Presentation Layer**: `features/[fitur]/components/`
- **Logic Layer**: `features/[fitur]/hooks/`
- **Integration**: `features/[fitur]/api.ts`
```

**BE Task Cross-References:**
```markdown
## Related Tasks
- **Frontend Requirements**: [Link to task-fe-xxx.md]
- **UI Data Needs**: [Link to task-ui-xxx.md] (if applicable)

## Architecture Compliance
- **Data Layer**: `app/api/[fitur]/route.ts`
- **Database**: `prisma/schema.prisma`
- **Integration**: API contract with frontend
```

## Multi-Type Task Handling

When a task involves multiple types:

1. **Identify Primary Type**: The main focus of the task
2. **Create Primary Document**: Use the format for the main focus
3. **Reference Secondary Tasks**: In the "Related Tasks" section, clearly indicate:
   ```markdown
   ## Multi-Type Task Structure
   
   **Primary**: [Type] - [Description]
   **Secondary Tasks Required**:
   - [Type]: [Brief description and link to separate doc]
   - [Type]: [Brief description and link to separate doc]
   
   **Implementation Order**:
   1. [Task order based on dependencies]
   2. [Next step]
   3. [Final integration]
   ```

## File Organization

**File Location**: `features/[feature-name]/docs/`
**Naming Convention**:
- UI: `task-ui/task-ui-[ID].md`
- FE: `task-fe/task-fe-[ID].md` 
- BE: `task-be/task-be-[ID].md`

**Cross-Reference Format**:
```markdown
[Task Type-ID: Title](../task-[type]/task-[type]-[ID].md)
```

## Quality Assurance Checklist

Before finalizing any task documentation, verify:

- [ ] **Correct Format Applied**: Appropriate template used based on task type
- [ ] **Architecture Compliance**: Proper layer alignment per `@docs/rules/architecture.md`
- [ ] **Cross-References**: Related tasks properly linked per `@docs/rules/task-docs-relationships.md`
- [ ] **UI Consistency**: UI tasks reference `@docs/uiux-consistency.md` and `@styles/globals.css`
- [ ] **Technical Specifications**: Complete and implementable specs provided
- [ ] **Acceptance Criteria**: Clear, measurable criteria defined
- [ ] **Test Strategy**: Appropriate testing approach outlined
- [ ] **Dependencies**: All task dependencies identified and documented

## Task Story Coverage

Ensure the task documentation covers:
1. **Complete Story Scope**: All aspects of the user story addressed
2. **Layer Integration**: How different architectural layers work together
3. **Feature Boundaries**: Clear boundaries within the feature module structure
4. **Implementation Path**: Clear path from design → frontend → backend → integration

## Example Usage Scenarios

**Scenario 1 - UI Task**: "Create design for product management dashboard"
- Apply: `@docs/rules/format-ui.md`
- Reference: `@docs/uiux-consistency.md`, `@styles/globals.css`
- Focus: Design specifications, component layout, design tokens

**Scenario 2 - FE Task**: "Implement product list component with search functionality"  
- Apply: `@docs/rules/format-task-fe.md`
- Reference: `@docs/rules/architecture.md` (components/hooks structure)
- Focus: React components, custom hooks, API integration

**Scenario 3 - BE Task**: "Create product management API endpoints"
- Apply: `@docs/rules/format-task-be.md`  
- Reference: `@docs/rules/architecture.md` (API routes structure)
- Focus: API routes, database schema, business logic

**Scenario 4 - Multi-Type Task**: "Complete product management feature"
- Primary: Determine based on user emphasis
- Create: Separate docs for each type with proper cross-references
- Ensure: Implementation order and integration points are clear

## Final Instructions

1. **Always start** by analyzing the task type using the classification logic above
2. **Apply the correct format** completely and thoroughly
3. **Include all required references** to architecture and design system files
4. **Establish proper cross-references** following the relationship guidelines
5. **Validate completeness** using the quality assurance checklist
6. **Ensure story coverage** addresses the complete scope of the user requirement

Remember: The goal is comprehensive, implementable documentation that enables seamless collaboration between UI/UX designers, frontend developers, and backend developers while maintaining architectural integrity and design consistency.