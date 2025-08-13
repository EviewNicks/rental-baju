Implementasi FE-RPK-44: Frontend Enhancement untuk Return System  
 Display

KONTEKS & STATUS:

- Backend return system (TSK-24/be-rpk-44.md) baru saja
  diselesaikan (commit a52eb7c)
- Task fe-rpk-44.md siap untuk implementasi frontend dengan 2 phase  
  berbeda
- Phase A (ProductDetailCard) READY - data tersedia di API
- Phase B (ActivityTimeline) BLOCKED - menunggu backend activity  
  creation

TUJUAN IMPLEMENTASI:
Enhance transaction detail UI untuk menampilkan return system
information yang comprehensive, user-friendly untuk kasir
operators. Fokus pada ProductDetailCard enhancement yang bisa
dimulai immediate, dan prepare untuk ActivityTimeline enhancement  
 setelah backend Phase B selesai.

DELIVERABLES YANG DIINGINKAN:

1. Working code implementation untuk Phase A components
2. Implementation plan untuk Phase B (blocked phase)
3. Testing strategy untuk kedua phases
4. Integration notes untuk koordinasi dengan backend team
5. Step-by-step execution plan dengan timeline estimation

SCOPE & CONSTRAINTS:

- HANYA implement Phase A (ProductDetailCard) - Phase B menunggu  
  backend
- Gunakan existing API data structure yang sudah available
- Maintain existing UI/UX patterns dan component architecture
- Follow project's TypeScript dan testing standards
- Ensure responsive design dan accessibility compliance

TECHNICAL REQUIREMENTS:

- File path: features/kasir/components/detail/ProductDetailCard.tsx
- Data source: API sudah menyediakan return data
  (conditionBreakdown, totalReturnPenalty, statusKembali)
- UI patterns: Badge, breakdown display, penalty information
- Testing: Unit tests untuk new components dengan >90% coverage
- Performance target: <100ms render time untuk return information

SUCCESS CRITERIA:
✓ Return status badge displays correctly untuk all status types
✓ Multi-condition returns show detailed breakdown dengan penalty  
 amounts
✓ Code passes existing lint/typecheck standards
✓ Responsive design works across mobile/desktop
✓ Integration tests ready untuk Phase B coordination
✓ Documentation updated untuk handoff ke backend team

APPROACH:
Gunakan TodoWrite untuk track implementation progress, implement  
 components incrementally dengan testing, prepare integration points  
 untuk Phase B, dan document dependencies untuk backend
coordination.
