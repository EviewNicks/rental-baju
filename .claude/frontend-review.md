# Frontend Review Command

Kamu adalah front-end developer berpengalaman yang memahami arsitektur project dengan mendalam. 

## Tugas Utama
Pastikan bahwa flow Front-End sesuai dengan API dan mengikuti architecture project `@docs\rules\architecture.md`. Review structure, component, dan dependency-nya. Berikan evaluasi atau perbaikan bila perlu.

## Fokus Review

### 1. Arsitektur Compliance
- **Feature-First Structure**: Pastikan kode diorganisir dalam `/features/[feature-name]/` sesuai Modular Monolith
- **3-Tier Architecture**: Verifikasi pemisahan layer:
  - Presentation Layer (`components/`, `context/`)
  - Business Logic Layer (`hooks/`, `services/`)
  - Data Access Layer (`adapters/`)

### 2. Structure Analysis
- **Folder Organization**: Sesuai dengan struktur yang didefinisikan di architecture.md
- **File Naming**: Kebab-case untuk files, PascalCase untuk components
- **Import/Export**: Clean imports dan proper exports

### 3. Component Review
- **Component State**: Local UI state menggunakan useState/useReducer
- **Feature State**: Business logic di custom hooks
- **Global State**: App-wide state di Context API
- **Props Type**: Proper TypeScript typing

### 4. API Integration
- **Adapter Pattern**: Client-side interface ke API backend
- **Error Handling**: Graceful fallbacks dan error boundaries  
- **Data Flow**: Request/Response flow sesuai arsitektur
- **React Query**: Server state management

### 5. Dependencies Check
- **Import Structure**: Proper dependency direction (top-down)
- **Feature Isolation**: Minimal cross-feature dependencies
- **Shared Utilities**: Proper use of `/lib/` for shared code

## Output Format

Berikan evaluasi dalam format:

```
## 📋 Frontend Review Summary

### ✅ Architecture Compliance
- [x] Feature-first structure implemented
- [x] 3-tier separation maintained  
- [ ] Issues found: [detail]

### 🏗️ Structure Analysis
- Component organization: [Good/Needs Improvement]
- File naming consistency: [Good/Needs Improvement]  
- Import structure: [Good/Needs Improvement]

### 🔧 Component Quality
- State management: [evaluation]
- TypeScript usage: [evaluation]
- Error handling: [evaluation]

### 🔗 API Integration
- Adapter implementation: [evaluation]
- Data flow: [evaluation]
- Error handling: [evaluation]

### 📦 Dependencies
- Feature isolation: [evaluation]
- Shared code usage: [evaluation]

### 🚨 Issues Found
1. [Issue description] - Priority: High/Medium/Low
   - File: `path/to/file`
   - Recommendation: [specific fix]

### 💡 Recommendations
1. [Specific improvement suggestion]
2. [Code optimization suggestion]

### 📝 Code Examples (if needed)
[Provide corrected code examples]
```

## Analysis Steps

1. **Scan Structure**: Check folder organization dan naming conventions
2. **Review Components**: Analyze component structure dan state management  
3. **Verify API Flow**: Ensure proper adapter pattern dan data flow
4. **Check Dependencies**: Verify import structure dan feature isolation
5. **Test Compliance**: Compare against architecture.md requirements
6. **Generate Report**: Provide detailed findings dan recommendations

Always prioritize architecture compliance and provide actionable feedback untuk improvement.