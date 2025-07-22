# Manage Product E2E Tests - Modular Structure

## 📁 **Test Organization**

The manage-product E2E tests have been organized into focused, modular files for better maintainability and clarity:

## 📁 **Login Account with MCP **

USERNAME = producer01
PASSWORD = akunproducer01

//Kasir Role
USERNAME = kasir01
PASSWORD = kasir01rentalbaju

//Owner Role 
USERNAME = owner01
PASSWORD = ardi14mei2005


The manage-product E2E tests have been organized into focused, modular files for better maintainability and clarity:

### **Test Files Structure**

```
__tests__/playwright/manage-product/
├── README.md                          # This documentation
├── product-listing.spec.ts            # Product display and view modes
├── product-search-filtering.spec.ts   # Search and filtering functionality
├── product-creation.spec.ts           # Product creation workflow
├── product-actions.spec.ts            # Product management actions
├── product-access-control.spec.ts     # Role-based access control
├── product-error-handling.spec.ts     # Error handling and edge cases
└── manage-product.spec.ts             # Original comprehensive test (kept for reference)
```

## 🎯 **Test Focus Areas**
Login
### **1. Product Listing (`product-listing.spec.ts`)**

- **Focus**: Product display, table/grid view modes, data presentation
- **Tests**: 4 test cases
- **Key Features**:
  - Page loading and component visibility
  - Default table view display
  - View mode switching (table/grid)
  - Product data display validation

### **2. Product Search & Filtering (`product-search-filtering.spec.ts`)**

- **Focus**: Search functionality, filtering, and data discovery
- **Tests**: 6 test cases
- **Key Features**:
  - Search by name or code
  - Advanced search patterns
  - Category and status filtering
  - Combined filters and reset functionality

### **3. Product Creation (`product-creation.spec.ts`)**

- **Focus**: Product creation workflow, form validation, data entry
- **Tests**: 8 test cases
- **Key Features**:
  - Navigation to add product form
  - Successful product creation
  - Form validation and error handling
  - Draft saving and data persistence

### **4. Product Actions (`product-actions.spec.ts`)**

- **Focus**: Product management operations, CRUD actions
- **Tests**: 8 test cases
- **Key Features**:
  - Actions menu functionality
  - Product deletion with confirmation
  - Edit and view navigation
  - Keyboard and accessibility support

### **5. Access Control (`product-access-control.spec.ts`)**

- **Focus**: Role-based permissions, authentication, security
- **Tests**: 8 test cases (across multiple describe blocks)
- **Key Features**:
  - Producer and Owner access validation
  - Kasir access restrictions
  - Session management and persistence
  - Multi-role scenarios

### **6. Error Handling (`product-error-handling.spec.ts`)**

- **Focus**: Error scenarios, edge cases, recovery mechanisms
- **Tests**: 9 test cases
- **Key Features**:
  - Navigation and network error handling
  - Form validation error states
  - Server error responses
  - Performance and browser compatibility

## 🏗️ **Architecture Benefits**

### **Modularity**

- Each file focuses on a specific functional area
- Tests are easier to locate and maintain
- Reduces cognitive load when working on specific features

### **Scalability**

- New test cases can be added to appropriate modules
- Easy to run specific test suites for targeted testing
- Better parallel execution possibilities

### **Maintainability**

- Clear separation of concerns
- Easier code reviews and collaboration
- Consistent documentation and structure

### **Reusability**

- Common patterns can be extracted to shared utilities
- Test helpers are shared across all modules
- Authentication states are centrally managed

## 🚀 **Running Tests**

### **All Manage Product Tests**

```bash
npx playwright test --grep "manage-product"
```

### **Specific Test Modules**

```bash
# Product listing tests only
npx playwright test product-listing.spec.ts

# Search and filtering tests only
npx playwright test product-search-filtering.spec.ts

# Product creation tests only
npx playwright test product-creation.spec.ts

# Product actions tests only
npx playwright test product-actions.spec.ts

# Access control tests only
npx playwright test product-access-control.spec.ts

# Error handling tests only
npx playwright test product-error-handling.spec.ts
```

### **Role-specific Tests**

```bash
# Producer role tests
npx playwright test --project="manage-product tests"

# Owner role tests (access control)
npx playwright test product-access-control.spec.ts --grep "Owner"
```

## 📊 **Test Coverage**

**Total Test Cases**: 41 tests across all modules

- **Product Listing**: 4 tests
- **Search & Filtering**: 6 tests
- **Product Creation**: 8 tests
- **Product Actions**: 8 tests
- **Access Control**: 8 tests
- **Error Handling**: 9 tests

**Authentication Coverage**:

- ✅ Producer role (primary testing role)
- ✅ Owner role (full access validation)
- ✅ Kasir role (access restriction validation)
- ✅ Unauthenticated users (security validation)

**Feature Coverage**:

- ✅ Complete CRUD operations
- ✅ Search and filtering
- ✅ Role-based access control
- ✅ Error handling and recovery
- ✅ UI/UX validation
- ✅ Performance and accessibility

## 🔧 **Development Guidelines**

### **Adding New Tests**

1. Identify the appropriate module for your test
2. Follow existing naming conventions and documentation patterns
3. Use shared test helpers and utilities
4. Include comprehensive JSDoc documentation
5. Add appropriate test-ids to UI components if needed

### **Test Documentation**

Each test case includes:

- **Purpose**: Clear explanation of what is being tested
- **Validates**: List of specific validation points
- **Business Value**: Why this test matters to the business
- **Additional Notes**: Implementation details or dependencies

### **Best Practices**

- Use descriptive test names that explain the scenario
- Include proper Given-When-Then structure
- Add screenshots for visual validation
- Handle different data states (empty, populated, error)
- Test both positive and negative scenarios

## 🔍 **Future Enhancements**

### **Potential Additions**

- **Performance testing**: Load testing with large datasets
- **Accessibility testing**: Full WCAG compliance validation
- **Mobile responsive**: Mobile device testing scenarios
- **Integration testing**: API integration validation
- **Visual regression**: Screenshot comparison testing

### **Test Data Management**

- Implement test data factories for consistent test data
- Add database seeding for reliable test scenarios
- Consider data cleanup strategies for test isolation

### **CI/CD Integration**

- Optimize test execution for CI pipelines
- Implement test result reporting and notifications
- Add automated test coverage reporting
