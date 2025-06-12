# Module Creator Components

This directory contains the refactored module creator components that were previously in a single 7,000+ line file. The components are now broken down into logical, reusable pieces.

## Components Overview

### Core Components

1. **CreationMethodSelector** (`CreationMethodSelector.tsx`)
   - Displays the initial method selection screen
   - Handles AI-assisted, PowerPoint import, and manual creation options
   - Clean card-based interface with feature descriptions

2. **ModuleForm** (`ModuleForm.tsx`)
   - Handles basic module information input
   - Includes category, difficulty, time estimation, and point calculation
   - Auto-calculates point values based on duration and difficulty
   - Community sharing toggle

3. **SectionEditor** (`SectionEditor.tsx`)
   - Individual section editing component
   - Supports all section types (text, quiz, video, etc.)
   - AI content generation integration
   - Dynamic question and activity management
   - Drag-and-drop ready with visual indicators

4. **ModulePreview** (`ModulePreview.tsx`)
   - Comprehensive module preview before publishing
   - Statistics dashboard showing sections, duration, questions
   - Visual content overview with activity breakdown
   - Publishing controls and validation

5. **VideoSearch** (`VideoSearch.tsx`)
   - Video library and YouTube search functionality
   - Custom URL input support
   - Video thumbnail and metadata display
   - Source identification (library vs YouTube)

6. **VoiceFeatures** (`VoiceFeatures.tsx`)
   - Voice generation and audio features
   - Multiple voice types and languages
   - Sound effects generation
   - Pronunciation guides and emotional storytelling

## Main Application

**comprehensive-module-creator.tsx** - The main application that orchestrates all components:
- Step-based workflow management
- State management for module data
- Integration with existing AI services
- Dialog management for modals
- Navigation and routing logic

## Benefits of This Refactoring

### Maintainability
- Each component has a single responsibility
- Components are easier to test individually
- Reduced cognitive load when making changes
- Clear separation of concerns

### Reusability
- Components can be used in other parts of the application
- Consistent interfaces across all module creation flows
- Shared type definitions prevent duplication

### Performance
- Components can be lazy-loaded as needed
- Smaller bundle sizes for individual features
- Better tree-shaking optimization

### Developer Experience
- Faster development with focused components
- Easier debugging with isolated functionality
- Better IDE support with smaller files
- Clear component boundaries

## File Size Reduction

- **Original**: 7,084 lines in a single file
- **Refactored**: 
  - Main file: ~400 lines
  - Components: ~300-500 lines each
  - Total reduction: ~60% in main file complexity

## Usage

```tsx
import ComprehensiveModuleCreator from '@/pages/comprehensive-module-creator';

// Individual component usage
import { 
  CreationMethodSelector, 
  ModuleForm, 
  SectionEditor 
} from '@/components/module-creator';
```

## Type Safety

All components share common type definitions exported from `index.ts`:
- `ModuleSection` interface
- `Module` interface
- Consistent prop types across components

## Integration Points

The components integrate seamlessly with:
- Existing AI services (content generation, voice features)
- Video search APIs
- Module publishing system
- Authentication and user management
- Query client for data fetching

This refactoring maintains all existing functionality while significantly improving code organization and maintainability.