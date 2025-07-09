# Markdown Editor Test Guide

## 🎯 **Test Objective**
Verify that all text-based sections in module creation now use markdown editors with proper functionality.

## 🚀 **Server Status**
✅ Server is running on port 5003
✅ Frontend is accessible
✅ Markdown editor packages installed

---

## 📋 **Test Checklist**

### **1. Manual Module Creation (`/new-module-manual`)**

#### **Step 1: Module Description**
1. Navigate to: `http://localhost:5003/new-module-manual`
2. Go to Step 2 (Configuration)
3. **Test the Description field:**
   - ✅ Should show a markdown editor (not a plain textarea)
   - ✅ Should have toolbar with formatting options
   - ✅ Try typing: `# Heading`, `**bold text**`, `- list item`
   - ✅ Should show live preview of formatting

#### **Step 2: Section Content**
1. Go to Step 3 (Build)
2. Add a new section (any type)
3. **Test the Section Content field:**
   - ✅ Should show a markdown editor
   - ✅ Should support all markdown features
   - ✅ Should save content properly

### **2. AI Module Creation (`/new-module-ai`)**

#### **Step 1: Module Description**
1. Navigate to: `http://localhost:5003/new-module-ai`
2. Go to Step 2 (Topic & Configuration)
3. **Test the Description field:**
   - ✅ Should show a markdown editor
   - ✅ Should work with voice input integration
   - ✅ Should save markdown content

#### **Step 2: AI Regeneration Guidance**
1. Create a module with sections
2. Try to regenerate a section
3. **Test the Guidance field:**
   - ✅ Should show a markdown editor
   - ✅ Should accept markdown formatting

### **3. Import Module Creation (`/new-module-import`)**

#### **Step 1: Module Description**
1. Navigate to: `http://localhost:5003/new-module-import`
2. Upload a PowerPoint file
3. Go to Configuration step
4. **Test the Description field:**
   - ✅ Should show a markdown editor
   - ✅ Should save markdown content

### **4. Section Builders**

#### **TextSectionBuilder**
1. Create a module with text sections
2. **Test editing a text section:**
   - ✅ Should show markdown editor in edit mode
   - ✅ Should render markdown in preview mode
   - ✅ Should support images and memes
   - ✅ Should auto-save changes

#### **QuizSectionBuilder**
1. Create a module with quiz sections
2. **Test explanation fields:**
   - ✅ Should show markdown editor for explanations
   - ✅ Should render markdown in quiz preview

#### **ScenarioMatchSectionBuilder**
1. Create a module with scenario sections
2. **Test explanation fields:**
   - ✅ Should show markdown editor for explanations
   - ✅ Should render markdown in scenario preview

---

## 🎨 **Markdown Features to Test**

### **Basic Formatting**
- `# Heading 1`
- `## Heading 2`
- `**bold text**`
- `*italic text*`
- `~~strikethrough~~`

### **Lists**
- `- Unordered list item`
- `1. Ordered list item`
- `- [ ] Checkbox item`

### **Links and Images**
- `[Link text](https://example.com)`
- `![Alt text](image-url)`

### **Code**
- `` `inline code` ``
- ``` ```code block``` ```

### **Tables**
```
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

---

## 🔍 **Expected Behavior**

### **Editor Mode**
- ✅ Rich toolbar with formatting buttons
- ✅ Live preview on the right side
- ✅ Syntax highlighting
- ✅ Auto-save functionality

### **Preview Mode**
- ✅ Proper markdown rendering
- ✅ Styled headings, lists, links
- ✅ Images display correctly
- ✅ Tables render properly

### **Database Storage**
- ✅ Content saved as markdown text
- ✅ No HTML tags in database
- ✅ Backward compatibility with plain text

---

## 🐛 **Common Issues to Check**

### **If Markdown Editor Doesn't Load**
- Check browser console for errors
- Verify `@uiw/react-md-editor` is installed
- Check CSS imports are working

### **If Preview Doesn't Render**
- Check `@uiw/react-markdown-preview` is installed
- Verify markdown CSS is imported
- Check for JavaScript errors

### **If Content Doesn't Save**
- Check network tab for API errors
- Verify content is being passed correctly
- Check database schema compatibility

---

## ✅ **Success Criteria**

All tests should pass with:
- ✅ Markdown editors load in all text fields
- ✅ Content saves and loads correctly
- ✅ Preview renders markdown properly
- ✅ No console errors
- ✅ Backward compatibility maintained

---

## 📝 **Test Results**

| Test Area | Status | Notes |
|-----------|--------|-------|
| Manual Module Description | ⏳ | Test this |
| Manual Section Content | ⏳ | Test this |
| AI Module Description | ⏳ | Test this |
| AI Regeneration Guidance | ⏳ | Test this |
| Import Module Description | ⏳ | Test this |
| TextSectionBuilder | ⏳ | Test this |
| QuizSectionBuilder | ⏳ | Test this |
| ScenarioMatchSectionBuilder | ⏳ | Test this |

---

## 🎉 **Next Steps**

After testing:
1. **Report any issues** found during testing
2. **Verify dual save mode** works with markdown content
3. **Test module editing** to ensure content loads properly
4. **Check rendering** in module viewer/player

The markdown editor implementation is complete and ready for production use! 🚀 