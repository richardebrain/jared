# Project Management Documentation

This folder contains the MentorMe project management documentation in a structured, maintainable format.

## Document Structure

### 📊 `pm_status.md` - Central Status Tracking
**Purpose**: Single source of truth for all task status across all epics
**Contents**:
- Task status overview tables for all epics
- Progress percentages and completion tracking
- Current priorities and weekly status updates
- Overall project metrics and analytics

**Use Cases**:
- Quick status check for any task
- Weekly progress reporting
- Identifying blocked or delayed tasks
- Project milestone tracking

### 🎯 `epics.md` - Epic Overview
**Purpose**: High-level strategic view of all project epics
**Contents**:
- Epic descriptions and business value
- Success criteria and key features
- Timeline and priority information
- Epic dependencies and roadmap

**Use Cases**:
- Strategic planning and roadmap visualization
- Understanding business context and priorities
- Epic dependency analysis
- High-level project communication

### 📋 `EP-XXX-YY.md` - Individual Task Files
**Purpose**: Detailed task specifications and requirements
**Contents**:
- Comprehensive task descriptions
- Technical requirements and specifications
- Implementation approaches and phases
- Success criteria and completion notes

**Use Cases**:
- Detailed technical planning
- Implementation reference during development
- Historical record of task evolution
- Knowledge transfer and documentation

## Navigation Guide

### For Quick Status Checks
1. Start with `pm_status.md` → Current status and priorities
2. Check epic progress percentages
3. Identify any blocked tasks needing attention

### For Strategic Planning
1. Review `epics.md` → Business context and roadmap
2. Analyze epic dependencies and priorities
3. Plan resource allocation and timeline

### For Implementation Details
1. Find task in `pm_status.md` → Get current status
2. Read corresponding `EP-XXX-YY.md` → Get detailed requirements
3. Reference related documentation links

## File Naming Convention

- **Epic Files**: `EP-XXX-YY.md` where XXX is epic number, YY is task number
- **Examples**: `EP-001-01.md`, `EP-002-05.md`, `EP-003-01.md`
- **Special Files**: `pm_status.md`, `epics.md`, `README.md`

## Maintenance Guidelines

### Status Updates
- **Always update `pm_status.md` first** for status changes
- Task files contain static requirements, not status
- Weekly status updates go in `pm_status.md`

### Adding New Tasks
1. Create new `EP-XXX-YY.md` file with detailed requirements
2. Add task entry to `pm_status.md` status table
3. Update epic overview in `epics.md` if needed

### Adding New Epics
1. Create epic section in `epics.md`
2. Add epic status table to `pm_status.md`
3. Create initial task files as needed

## Benefits of This Structure

### ✅ Maintainability
- Small, focused files instead of one massive document
- Easy to update status without scrolling through requirements
- Clear separation of concerns

### ✅ Scalability
- Can add unlimited epics and tasks without file bloat
- Better organization as project grows
- Easier to find specific information

### ✅ Performance
- Faster loading of smaller files
- Better navigation and searching
- Reduced merge conflicts

### ✅ Clarity
- Status tracking separated from detailed specifications
- Business context separated from technical details
- Historical progression clearly documented

## Migration from Previous Structure

The original `docs/project_management.md` has been restructured into:
- Status tracking → `pm_status.md`
- Epic descriptions → `epics.md`  
- Task details → Individual `EP-XXX-YY.md` files
- All information preserved, better organized

**Previous single file**: All project management was in one large file
**New structure**: Distributed across focused, maintainable files
**Status updates**: Now centralized in [`pm_status.md`](pm_status.md)

## Quick Links

- [📊 Current Status](pm_status.md) - All task status and priorities
- [🎯 Epic Overview](epics.md) - Strategic roadmap and business context
- [📋 Task Index](#task-index) - Links to all individual task files

## Task Index

### EP-001: Dynamic Initial Assessment
- [EP-001-01](EP-001-01.md) - Investigate Existing Assessment Codebase
- [EP-001-08](EP-001-08.md) - Weighted Adaptive Question Selection Service
- *(Additional task files can be created as needed)*

### EP-002: Admin UI for Question Management
- *(Task files to be created as needed)*

### EP-003: JWT Authentication & Authorization
- *(Task files to be created as needed)*

### EP-004: Admin UI for Assessment Results
- *(Task files to be created as needed)* 