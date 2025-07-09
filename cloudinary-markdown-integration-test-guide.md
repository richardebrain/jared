# Cloudinary Markdown Editor Integration Test Guide

## Overview
This guide tests the enhanced markdown editor functionality that integrates with Cloudinary for seamless image uploads and management in the MentorMe application.

## Prerequisites
- Server running on port 5003
- User logged in (authentication required for uploads)
- Cloudinary service configured and working
- All markdown editor components updated to use CloudinaryMarkdownEditor

## Test Areas

### 1. Backend API Routes

#### Test: Markdown Upload Routes Registration
**Location:** `server/api/markdownUploadRoutes.ts`

**Steps:**
1. Check server logs for route registration
2. Verify routes are accessible:
   - `POST /api/markdown/upload-image`
   - `POST /api/markdown/upload-images`
   - `DELETE /api/markdown/delete-image`

**Expected Result:**
- Routes should be registered without errors
- Authentication middleware should be applied

#### Test: Single Image Upload API
**Endpoint:** `POST /api/markdown/upload-image`

**Steps:**
1. Create a test image file (JPEG/PNG, < 5MB)
2. Send POST request with FormData containing the image
3. Include authentication headers

**Expected Result:**
- 200 OK response with image URL
- Image uploaded to Cloudinary in `mentor-me/modules/{userId}` folder
- Response includes: `{ success: true, url: "cloudinary_url", filename, size }`

#### Test: Multiple Image Upload API
**Endpoint:** `POST /api/markdown/upload-images`

**Steps:**
1. Create multiple test image files
2. Send POST request with FormData containing multiple images
3. Include authentication headers

**Expected Result:**
- 200 OK response with array of uploaded images
- All images uploaded to Cloudinary
- Response includes: `{ success: true, images: [{ url, filename, size }] }`

#### Test: Image Deletion API
**Endpoint:** `DELETE /api/markdown/delete-image`

**Steps:**
1. Upload an image first
2. Send DELETE request with image URL in body
3. Include authentication headers

**Expected Result:**
- 200 OK response
- Image deleted from Cloudinary
- Response includes: `{ success: true, message: "Image deleted successfully" }`

### 2. Frontend CloudinaryMarkdownEditor Component

#### Test: Component Rendering
**Location:** `client/src/components/CloudinaryMarkdownEditor.tsx`

**Steps:**
1. Navigate to any page using the CloudinaryMarkdownEditor
2. Verify component renders correctly
3. Check for upload button in toolbar

**Expected Result:**
- Component renders without errors
- Upload button visible in toolbar
- Drag & drop hint displayed
- Markdown editor functionality works

#### Test: File Upload via Button
**Steps:**
1. Click upload button in toolbar
2. Select an image file
3. Wait for upload to complete

**Expected Result:**
- File picker opens
- Image uploads to Cloudinary
- Markdown image syntax inserted: `![filename](cloudinary_url)`
- Success toast notification
- Loading overlay during upload

#### Test: Drag & Drop Upload
**Steps:**
1. Drag an image file over the editor
2. Drop the file
3. Wait for upload to complete

**Expected Result:**
- Drag & drop accepted
- Image uploads to Cloudinary
- Markdown image syntax inserted
- Success toast notification

#### Test: Paste from Clipboard
**Steps:**
1. Copy an image to clipboard (e.g., screenshot)
2. Paste into the editor (Ctrl+V/Cmd+V)
3. Wait for upload to complete

**Expected Result:**
- Image pasted from clipboard
- Image uploads to Cloudinary
- Markdown image syntax inserted
- Success toast notification

#### Test: File Validation
**Steps:**
1. Try uploading non-image files
2. Try uploading files > 5MB
3. Try uploading empty files

**Expected Result:**
- Non-image files rejected with error message
- Large files rejected with size limit message
- Empty files handled gracefully

### 3. Section Builders Integration

#### Test: TextSectionBuilder
**Location:** `client/src/components/SectionBuilders/TextSectionBuilder.tsx`

**Steps:**
1. Navigate to module creation
2. Add a text section
3. Test image upload in the markdown editor

**Expected Result:**
- CloudinaryMarkdownEditor renders correctly
- Image uploads work
- Content saves properly with images

#### Test: QuizSectionBuilder
**Location:** `client/src/components/SectionBuilders/QuizSectionBuilder.tsx`

**Steps:**
1. Navigate to module creation
2. Add a quiz section
3. Test image upload in question explanations

**Expected Result:**
- CloudinaryMarkdownEditor renders in explanations
- Image uploads work for explanations
- Content saves properly

#### Test: ScenarioMatchSectionBuilder
**Location:** `client/src/components/SectionBuilders/ScenarioMatchSectionBuilder.tsx`

**Steps:**
1. Navigate to module creation
2. Add a scenario matching section
3. Test image upload in scenario explanations

**Expected Result:**
- CloudinaryMarkdownEditor renders in explanations
- Image uploads work for explanations
- Content saves properly

### 4. Module Creation Pages

#### Test: Manual Module Creation
**Location:** `client/src/pages/new-module-manual.tsx`

**Steps:**
1. Navigate to `/new-module-manual`
2. Fill in module description
3. Test image upload in description field
4. Add sections and test image upload in section content

**Expected Result:**
- CloudinaryMarkdownEditor in description field
- Image uploads work in description
- Section content editors support image uploads
- Module saves with images

#### Test: AI Module Creation
**Location:** `client/src/pages/new-module-ai.tsx`

**Steps:**
1. Navigate to `/new-module-ai`
2. Fill in module description
3. Test image upload in description field
4. Test image upload in regeneration guidance dialog

**Expected Result:**
- CloudinaryMarkdownEditor in description field
- Image uploads work in description
- Regeneration guidance dialog supports image uploads
- Module saves with images

#### Test: Import Module Creation
**Location:** `client/src/pages/new-module-import.tsx`

**Steps:**
1. Navigate to `/new-module-import`
2. Upload PowerPoint file
3. Fill in module description
4. Test image upload in description field

**Expected Result:**
- CloudinaryMarkdownEditor in description field
- Image uploads work in description
- Module saves with images

### 5. Error Handling

#### Test: Network Errors
**Steps:**
1. Disconnect internet
2. Try uploading an image
3. Reconnect internet
4. Try uploading again

**Expected Result:**
- Network errors handled gracefully
- Error toast notifications
- Upload retry works after reconnection

#### Test: Authentication Errors
**Steps:**
1. Log out user
2. Try uploading an image
3. Log back in
4. Try uploading again

**Expected Result:**
- Authentication errors handled
- User redirected to login if needed
- Upload works after authentication

#### Test: Cloudinary Service Errors
**Steps:**
1. Temporarily break Cloudinary configuration
2. Try uploading an image
3. Fix configuration
4. Try uploading again

**Expected Result:**
- Service errors handled gracefully
- Error messages displayed
- Upload works after service restoration

### 6. Performance Testing

#### Test: Large Image Uploads
**Steps:**
1. Upload images close to 5MB limit
2. Monitor upload time
3. Check browser performance

**Expected Result:**
- Large images upload successfully
- Reasonable upload times
- No browser freezing

#### Test: Multiple Concurrent Uploads
**Steps:**
1. Upload multiple images simultaneously
2. Monitor upload progress
3. Check final results

**Expected Result:**
- Multiple uploads handled correctly
- Progress indicators work
- All images uploaded successfully

### 7. Security Testing

#### Test: File Type Validation
**Steps:**
1. Try uploading various file types
2. Check server-side validation
3. Verify client-side validation

**Expected Result:**
- Only image files accepted
- Malicious files rejected
- Validation works on both client and server

#### Test: User Isolation
**Steps:**
1. Upload images as User A
2. Check User B's access to images
3. Verify folder structure in Cloudinary

**Expected Result:**
- Images isolated by user ID
- Users can't access others' images
- Proper folder structure: `mentor-me/modules/{userId}`

## Common Issues and Solutions

### Issue: Images not uploading
**Possible Causes:**
- Cloudinary configuration incorrect
- Authentication missing
- File size too large
- Network connectivity issues

**Solutions:**
- Check Cloudinary environment variables
- Verify user is logged in
- Reduce file size
- Check network connection

### Issue: Markdown syntax not inserted
**Possible Causes:**
- onChange handler not working
- Component not properly integrated
- State management issues

**Solutions:**
- Check onChange prop implementation
- Verify component integration
- Debug state management

### Issue: Upload button not visible
**Possible Causes:**
- CSS styling issues
- Component not rendering
- Toolbar configuration problems

**Solutions:**
- Check CSS classes
- Verify component rendering
- Debug toolbar configuration

## Success Criteria

✅ All API endpoints working correctly
✅ Image uploads to Cloudinary successful
✅ Markdown syntax inserted properly
✅ Error handling working
✅ Performance acceptable
✅ Security measures in place
✅ User experience smooth and intuitive

## Notes

- All image uploads require authentication
- Images are organized by user ID in Cloudinary
- File size limit is 5MB per image
- Supported formats: JPEG, PNG, GIF, SVG
- Drag & drop and paste functionality available
- Real-time upload progress and feedback 