# RPK-52: Category Types API Testing Guide

## 🎯 Objective
Testing documentation untuk Category Types API enhancement (Phase 2: API Layer Enhancement)

## 📋 Testing Prerequisites

### **Environment Setup:**
- Development server running: `yarn app` → http://localhost:3000
- Postman collection: `docs/api/product/category.json` (v4.1.0)
- Clerk authentication token dari browser cookies

### **Required Variables:**
```
base_url: http://localhost:3000
clerk_session_token: [Get from browser cookies]
category_id: [Auto-captured dari Create Category]
```

## 🧪 Test Scenarios (Keep It Simple)

### **1. GET All Categories**
**Endpoint:** `GET /api/categories`
**Expected Response:** Categories array dengan `type` field
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Existing Category",
      "color": "#FF5733",
      "type": "clothing", // ✅ Should appear for all categories
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### **2. Create Category - Age Based Accessories**
**Endpoint:** `POST /api/categories`
**Request Body:**
```json
{
  "name": "Sarung Batik",
  "color": "#8B4513",
  "type": "accessories_age_based"
}
```
**Expected:** Status 201 dengan type field

### **3. Create Category - Universal Accessories**
**Endpoint:** `POST /api/categories`
**Request Body:**
```json
{
  "name": "Anting Kalung",
  "color": "#FFD700",
  "type": "accessories_universal"
}
```
**Expected:** Status 201 dengan type field

### **4. Create Category - Default Clothing**
**Endpoint:** `POST /api/categories`
**Request Body:**
```json
{
  "name": "Baju Kaos",
  "color": "#0000FF"
  // type omitted → should default to "clothing"
}
```
**Expected:** Status 201 dengan `type: "clothing"`

### **5. Update Category Type**
**Endpoint:** `PUT /api/categories/{{category_id}}`
**Request Body:**
```json
{
  "type": "accessories_universal"
}
```
**Expected:** Status 200 dengan updated type field

### **6. Invalid Type Validation**
**Endpoint:** `POST /api/categories`
**Request Body:**
```json
{
  "name": "Invalid Category",
  "color": "#FF0000",
  "type": "invalid_type"
}
```
**Expected:** Status 400 dengan error message:
```json
{
  "error": {
    "message": "Tipe kategori harus salah satu dari: clothing, accessories_age_based, accessories_universal",
    "code": "VALIDATION_ERROR"
  }
}
```

## 🧪 Postman Test Automation

### **Automated Tests Included:**
1. ✅ Status code validation (200/201)
2. ✅ Response time < 2s
3. ✅ Response structure validation
4. ✅ **Category type field presence**
5. ✅ **Category type value validation**
6. ✅ Error response structure
7. ✅ Authentication validation

### **Test Results Interpretation:**
- ✅ **Green**: All tests passed → Implementation working correctly
- ❌ **Red**: Check error details in Postman console
- ⚠️ **Yellow**: Some tests skipped (common for error responses)

## 📊 Success Criteria

### **Functional Requirements:**
- [ ] GET /api/categories returns type field for all categories
- [ ] POST /api/categories accepts type field with proper validation
- [ ] PUT /api/categories/[id] supports type field updates
- [ ] Invalid category types return proper error messages
- [ ] Default type handling works (omitted type → 'clothing')

### **Technical Requirements:**
- [ ] Response time < 2s for all endpoints
- [ ] Type field validation with custom error messages
- [ ] Backward compatibility with existing categories
- [ ] Consistent API response format

## 🚨 Common Issues & Solutions

### **Authentication Issues:**
**Problem:** 401 Unauthorized
**Solution:** Update `clerk_session_token` dari browser cookies

### **Validation Errors:**
**Problem:** 400 Bad Request dengan validation error
**Solution:** Check request body format dan category type values

### **Missing Type Field:**
**Problem:** Response tidak include type field
**Solution:** Verify database schema includes type column

## 📈 Next Steps

### **After Testing Complete:**
1. ✅ **Task 2.8**: API Integration Testing → Done via Postman
2. ✅ **Task 2.9**: Complete Flow Testing → Done via test scenarios
3. 🔄 **Task 2.10**: Backward Compatibility → Manual verification needed

### **Production Readiness:**
- All test scenarios pass ✅
- Documentation complete ✅
- Ready for Phase 3: Dynamic Form Implementation 🚀

---

**Testing Status:** Ready for execution
**Postman Collection:** `docs/api/product/category.json` (v4.1.0)
**Documentation Version:** 1.0
**Last Updated:** 2025-10-23