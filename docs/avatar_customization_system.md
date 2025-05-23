# MentorMe: Avatar Customization System

## Overview

The Avatar Customization System allows teachers to personalize their digital representation on the MentorMe platform. This gamified feature increases engagement by providing a reward mechanism for completing learning activities. Teachers earn "Bear Bucks" that can be spent on avatar customization items, creating a positive reinforcement loop for continued learning.

## System Components

### 1. Avatar Base Model

The avatar system starts with a base character model that can be customized with various items and accessories. The base model includes:

- Head shape
- Body type
- Base skin/color tone

### 2. Customization Categories

Items are organized into categories for easier navigation and management:

| Category ID | Category Name | Description |
|-------------|---------------|-------------|
| 1 | Hair | Hairstyles and colors |
| 2 | Eyes | Eye shapes and colors |
| 3 | Clothing | Shirts, pants, dresses, uniforms |
| 4 | Accessories | Glasses, jewelry, hats, badges |
| 5 | Backgrounds | Scene backgrounds for avatar display |

### 3. Item Rarity and Pricing

Items have different rarity levels which affect their Bear Bucks price:

| Rarity Level | Price Range (Bear Bucks) | Availability |
|--------------|--------------------------|--------------|
| Common | 5-20 | Always available |
| Uncommon | 25-50 | Regularly available |
| Rare | 60-100 | Limited availability |
| Legendary | 150-300 | Special events only |

### 4. Item Acquisition Methods

Teachers can acquire customization items through several mechanisms:

1. **Direct Purchase**: Spending Bear Bucks in the avatar shop
2. **Achievement Rewards**: Unlocking special items by reaching milestones
3. **Level Rewards**: Gaining exclusive items when reaching new teacher levels
4. **Special Events**: Limited-time items available during platform events
5. **School Rewards**: School-specific items awarded by administrators

## User Interface

### Avatar Customization Screen

The avatar customization interface consists of three main tabs:

#### 1. Customize Tab

This tab allows teachers to view and modify their current avatar appearance:

- Avatar preview with real-time updates
- Currently equipped items by category
- Option to save multiple avatar configurations
- Ability to set an avatar as active

#### 2. Shop Tab

This tab allows teachers to browse and purchase new items:

- Categorized browsing of available items
- Item details including name, description, and price
- Purchase confirmation dialog
- "Try Before You Buy" preview functionality

#### 3. My Avatars Tab

This tab allows teachers to manage multiple saved avatars:

- List of saved avatar configurations
- Ability to switch between different avatars
- Option to edit existing avatars
- Delete unwanted avatar configurations

## Bear Bucks Economy

The virtual currency "Bear Bucks" drives the avatar customization system:

### Earning Bear Bucks

Teachers can earn Bear Bucks through various platform activities:

1. **Completing Modules**: 5-20 Bear Bucks per module based on difficulty
2. **Assessment Performance**: 1-5 Bear Bucks per correct answer
3. **Daily Login Streak**: Increasing rewards for consecutive days
4. **Receiving Shoutouts**: 5 Bear Bucks when recognized by peers
5. **School Admin Awards**: Bonus Bear Bucks for exceptional performance

### Spending Bear Bucks

Teachers can spend Bear Bucks on:

1. **Avatar Items**: Customization elements for their digital representation
2. **Special Features**: Unlocking premium platform capabilities
3. **Gift Items**: Sending customization items to other teachers

## Technical Implementation

### Database Structure

The avatar system uses four key tables:

1. **avatarCategories**: Defines the categories for organization
2. **avatarItems**: Contains all available customization items
3. **userAvatars**: Stores saved avatar configurations for each user
4. **userAvatarItems**: Tracks which items each user has purchased

#### Key Relationships

- Each user can have multiple avatar configurations
- Each avatar configuration can use multiple items
- Items belong to specific categories
- Users purchase items which are then available to all their avatars

### Rendering Process

1. Avatar configurations are stored as JSON data
2. When loading an avatar, the system retrieves the user's active avatar configuration
3. The renderer applies each component in layer order (background, body, clothing, accessories, etc.)
4. The resulting composite image is used throughout the platform

### Avatar Data Model

```typescript
interface Avatar {
  id: number;
  userId: number;
  name: string;
  isActive: boolean;
  baseColor: string;
  createdAt: Date;
  items: AvatarItemAssignment[];
}

interface AvatarItemAssignment {
  avatarItemId: number;
  categoryId: number;
  position: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
}

interface AvatarItem {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  image: string;
  price: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  isDefault: boolean;
}
```

## API Endpoints

### Avatar Management

```
GET /api/avatars
Returns all avatars belonging to the current user

GET /api/avatars/:id
Returns a specific avatar configuration

POST /api/avatars
Creates a new avatar configuration

PUT /api/avatars/:id
Updates an existing avatar configuration

DELETE /api/avatars/:id
Deletes an avatar configuration

POST /api/avatars/:id/activate
Sets the specified avatar as the user's active avatar
```

### Item Management

```
GET /api/avatar-items
Returns all available avatar items

GET /api/avatar-items/categories
Returns all avatar item categories

GET /api/user-avatar-items
Returns all items owned by the current user

POST /api/user-avatar-items/purchase/:itemId
Purchases a specific item for the current user
```

## Engagement Strategies

### Progressive Unlocking

The avatar system implements progressive unlocking to maintain long-term engagement:

1. **Basic Items**: Available to all users from the start
2. **Milestone Items**: Unlocked at specific platform usage milestones
3. **Achievement Items**: Unlocked by completing specific challenges
4. **Premium Items**: Available only after reaching higher teacher levels

### Limited-Time Availability

Some avatar items are only available during specific periods:

1. **Seasonal Items**: Available during holidays or school seasons
2. **Event Items**: Available during special platform events
3. **Collection Items**: Part of limited-time themed collections

### Social Features

The avatar system includes social elements to drive engagement:

1. **Avatar Showcase**: Display avatar on profile and leaderboards
2. **Item Gifting**: Allow teachers to gift items to colleagues
3. **School Themes**: School-specific avatar items for team building

## Future Enhancements

### Planned Features

1. **Animation Support**: Animated avatar elements and poses
2. **Avatar Backgrounds**: Contextual backgrounds for different platform areas
3. **Achievement Badges**: Visual display of accomplishments on avatars
4. **Custom Color Palettes**: User-defined color adjustments for items
5. **Avatar Stickers**: Small avatar representations for use in messages

### Integration Opportunities

1. **Teacher Portfolios**: Avatar representation in professional showcases
2. **Classroom Materials**: Use of teacher avatars in printable materials
3. **Video Lessons**: Avatar representation in video content
4. **School Branding**: Integration with school logo and colors

## Performance Considerations

### Asset Management

1. **Image Optimization**: All avatar items use optimized SVG or compressed PNG
2. **Lazy Loading**: Items load only when needed for display
3. **Caching Strategy**: Common avatar compositions are cached

### Rendering Efficiency

1. **Composition Caching**: Avatar renders are cached until changes occur
2. **Responsive Sizing**: Avatars render at appropriate resolution for display context
3. **Progressive Loading**: Lower resolution placeholders during loading

## Appendix

### Default Items

Each new user starts with these basic customization options:

| Category | Default Items |
|----------|---------------|
| Hair | Basic Short Hair, Basic Long Hair, Basic Curly Hair |
| Eyes | Round Eyes, Almond Eyes, Wide Eyes |
| Clothing | Plain T-Shirt, Basic Blouse, Simple Polo |
| Accessories | Reading Glasses, Simple Necklace |
| Backgrounds | Classroom, Office, Outdoors |

### Special Achievement Items

These items are only unlocked through specific achievements:

| Achievement | Unlocked Item |
|-------------|---------------|
| Complete 10 modules | "Scholar's Cap" (Accessory) |
| Reach Level 5 | "Mentor's Robe" (Clothing) |
| 30-day login streak | "Dedication Badge" (Accessory) |
| Receive 25 shoutouts | "Community Star" (Background) |
| Complete all assessments | "Wisdom Glasses" (Accessory) |