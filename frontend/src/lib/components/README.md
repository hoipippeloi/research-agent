# Components Directory

This directory contains reusable Svelte components used throughout the Research Agent application.

## Available Components

### SearchSuggest.svelte

A generic, reusable searchable dropdown component that works with any type of data. Features advanced search, filtering, custom rendering, and visual feedback.

**Features:**
- 🔍 Real-time search filtering across multiple fields
- ✨ Visual feedback for selected items
- 🗑️ Clear selection functionality
- 🎯 Support for required/optional fields
- 🎨 Custom item rendering with snippets
- 📊 Generic data support (works with any object type)
- ⚡ Custom filtering functions
- ⌨️ Full keyboard navigation
- 📱 Responsive design
- ♿ Accessibility support with ARIA
- 🎨 Consistent styling with app theme

**Basic Usage:**
```svelte
<script>
    import SearchSuggest from '$lib/components/SearchSuggest.svelte';
    
    let selectedCollection = null;
    let searchQuery = "";
    let collections = []; // Your collections array
</script>

<SearchSuggest
    data={collections}
    displayField="topic"
    searchFields={["topic"]}
    selectedItem={selectedCollection}
    {searchQuery}
    label="Choose Collection"
    placeholder="Search collections..."
    onselect={(collection) => {
        selectedCollection = collection;
        searchQuery = "";
    }}
    onclear={() => {
        selectedCollection = null;
        searchQuery = "";
    }}
    onsearch={(query) => {
        searchQuery = query;
    }}
/>
```

**Advanced Usage with Custom Rendering:**
```svelte
<SearchSuggest
    data={users}
    displayField="name"
    searchFields={["name", "email", "department"]}
    selectedItem={selectedUser}
    label="Assign to User"
    placeholder="Search by name, email, or department..."
    onselect={(user) => selectedUser = user}
    onclear={() => selectedUser = null}
    customFilter={(items, query) =>
        items.filter(item =>
            item.active &&
            item.name.toLowerCase().includes(query.toLowerCase())
        )
    }
>
    {#snippet itemRenderer(user, isSelected)}
        <div class="flex items-center gap-3">
            <img src={user.avatar} alt={user.name} class="w-8 h-8 rounded-full" />
            <div>
                <div class="font-medium {isSelected ? 'text-blue-700' : ''}">{user.name}</div>
                <div class="text-xs text-zinc-500">{user.email} • {user.department}</div>
            </div>
        </div>
    {/snippet}
</SearchSuggest>
```

**Props:**
- `data: T[]` - Array of items to search/select from
- `displayField: keyof T` - Field to display as the main text
- `searchFields?: (keyof T)[]` - Fields to search in (defaults to displayField)
- `selectedItem?: T | null` - Currently selected item
- `searchQuery?: string` - Current search query value
- `label?: string` - Label text for the input field
- `placeholder?: string` - Placeholder text for the input
- `disabled?: boolean` - Whether the component is disabled
- `required?: boolean` - Whether the field is required (shows * in label)
- `clearable?: boolean` - Whether to show clear button (default: true)
- `emptyMessage?: string` - Message when no data available
- `noResultsMessage?: string` - Message when no search results found
- `maxHeight?: string` - Maximum height of dropdown (default: 12rem)
- `onselect?: (item: T) => void` - Called when an item is selected
- `onclear?: () => void` - Called when selection is cleared
- `onsearch?: (query: string) => void` - Called when search query changes
- `customFilter?: (items: T[], query: string) => T[]` - Custom filtering function
- `getItemKey?: (item: T) => string | number` - Custom key extraction function
- `itemRenderer?: Snippet<[T, boolean]>` - Custom item rendering snippet

**Snippets:**
- `itemRenderer(item, isSelected)` - Custom rendering for each dropdown item

### Other Components

#### BirdsFlocking.svelte
Animated background component with flocking bird animation for loading states.

#### EmailModal.svelte
Modal component for email input and authentication flow.

#### Header.svelte
Application header component with navigation and user controls.

#### MarkdownEditor.svelte
Rich text editor component with markdown support.

#### MarkdownPreviewModal.svelte
Modal component for previewing markdown content.

#### Modal.svelte
Base modal component with backdrop and close functionality.

#### CollisionVisualization.svelte
Visualization component for collision detection algorithms.

## Usage Guidelines

### Importing Components
```svelte
import ComponentName from '$lib/components/ComponentName.svelte';
```

### SearchSuggest Examples

**Simple List:**
```svelte
<SearchSuggest
    data={fruits}
    displayField="name"
    selectedItem={selectedFruit}
    onselect={(fruit) => selectedFruit = fruit}
/>
```

**Multi-field Search:**
```svelte
<SearchSuggest
    data={products}
    displayField="name"
    searchFields={["name", "sku", "category"]}
    selectedItem={selectedProduct}
    onselect={(product) => selectedProduct = product}
/>
```

**Custom Filtering:**
```svelte
<SearchSuggest
    data={employees}
    displayField="fullName"
    searchFields={["fullName", "email"]}
    selectedItem={selectedEmployee}
    customFilter={(employees, query) =>
        employees.filter(emp => 
            emp.active && 
            emp.department === 'Engineering' &&
            emp.fullName.toLowerCase().includes(query.toLowerCase())
        )
    }
    onselect={(employee) => selectedEmployee = employee}
/>
```

### State Management
- Components use Svelte 5 runes (`$state`, `$derived`, `$props`)
- Pass reactive data through props
- Use callback props for event handling instead of Svelte events

### Styling
- Components use Tailwind CSS for styling
- All components are designed to be consistent with the app's design system
- Use `class` prop for additional styling when needed

### Accessibility
- All interactive components include proper ARIA labels
- Keyboard navigation is supported where applicable
- Focus management is handled automatically

## Development Guidelines

### Creating New Components

1. **File Naming**: Use PascalCase for component files (e.g., `MyComponent.svelte`)
2. **Props Interface**: Define a clear props interface at the top of the script
3. **Documentation**: Include usage examples in component comments
4. **TypeScript**: Use TypeScript for type safety
5. **Accessibility**: Include proper ARIA attributes and keyboard support

### Example Component Structure
```svelte
<!--
    MyComponent - Brief description
    
    Usage:
    ```svelte
    <MyComponent prop1="value" onaction={(data) => handleAction(data)} />
    ```
    
    For generic components like SearchSuggest:
    ```svelte
    <SearchSuggest
        data={myData}
        displayField="name" 
        searchFields={["name", "description"]}
        selectedItem={selected}
        onselect={(item) => selected = item}
    />
    ```
-->
<script lang="ts">
    interface Props {
        prop1: string;
        prop2?: number;
        onaction?: (data: any) => void;
    }
    
    let { prop1, prop2 = 0, onaction }: Props = $props();
    
    // Component logic here
</script>

<!-- Component template here -->

<style>
    /* Component-specific styles if needed */
</style>
```

### Testing Components
- Test components with different prop combinations
- Ensure keyboard accessibility works
- Test responsive behavior
- Validate TypeScript types

## Best Practices

1. **Keep Components Focused**: Each component should have a single responsibility
2. **Use Callback Props**: Prefer callback props over Svelte events for better reusability
3. **Handle Loading States**: Include loading and error states where appropriate
4. **Make Components Configurable**: Use props to make components flexible
5. **Document Thoroughly**: Include usage examples and prop descriptions
6. **Follow Design System**: Maintain consistency with the app's visual design
7. **Consider Performance**: Use `$derived` for computed values and avoid unnecessary updates

## Contributing

When adding new components:

1. Create the component file in this directory
2. Add appropriate TypeScript types
3. Document the component in this README
4. Test the component thoroughly
5. Update any relevant type definitions

For questions about component architecture or usage, refer to the main application documentation.