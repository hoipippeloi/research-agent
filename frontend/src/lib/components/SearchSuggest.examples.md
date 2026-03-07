# SearchSuggest Component Usage Examples

This document provides comprehensive examples of how to use the generic `SearchSuggest` component with various data types and configurations.

## Basic Examples

### 1. Simple String Array
```svelte
<script>
    import SearchSuggest from '$lib/components/SearchSuggest.svelte';
    
    let fruits = [
        { id: 1, name: 'Apple', color: 'red' },
        { id: 2, name: 'Banana', color: 'yellow' },
        { id: 3, name: 'Orange', color: 'orange' }
    ];
    let selectedFruit = null;
    let searchQuery = "";
</script>

<SearchSuggest
    data={fruits}
    displayField="name"
    searchFields={["name", "color"]}
    {selectedFruit}
    {searchQuery}
    label="Choose a Fruit"
    placeholder="Search fruits..."
    onselect={(fruit) => {
        selectedFruit = fruit;
        searchQuery = "";
    }}
    onclear={() => {
        selectedFruit = null;
        searchQuery = "";
    }}
    onsearch={(query) => searchQuery = query}
/>
```

### 2. User Selection
```svelte
<script>
    let users = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            department: 'Engineering',
            active: true,
            avatar: '/avatars/john.jpg'
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            department: 'Design',
            active: true,
            avatar: '/avatars/jane.jpg'
        }
    ];
    let selectedUser = null;
    let userSearch = "";
</script>

<SearchSuggest
    data={users}
    displayField="name"
    searchFields={["name", "email", "department"]}
    selectedItem={selectedUser}
    searchQuery={userSearch}
    label="Assign to User"
    placeholder="Search by name, email, or department..."
    onselect={(user) => {
        selectedUser = user;
        userSearch = "";
    }}
    onclear={() => {
        selectedUser = null;
        userSearch = "";
    }}
    onsearch={(query) => userSearch = query}
>
    {#snippet itemRenderer(user, isSelected)}
        <div class="flex items-center gap-3">
            <img 
                src={user.avatar} 
                alt={user.name} 
                class="w-8 h-8 rounded-full object-cover"
            />
            <div class="flex-1">
                <div class="font-medium {isSelected ? 'text-blue-700' : ''}">{user.name}</div>
                <div class="text-xs text-zinc-500">{user.email} • {user.department}</div>
            </div>
            {#if !user.active}
                <span class="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">Inactive</span>
            {/if}
        </div>
    {/snippet}
</SearchSuggest>
```

## Advanced Examples

### 3. Product Search with Custom Filtering
```svelte
<script>
    let products = [
        {
            id: 1,
            name: 'MacBook Pro',
            sku: 'APPLE-MBP-001',
            price: 2499,
            category: 'Laptops',
            inStock: true,
            image: '/products/macbook.jpg'
        },
        {
            id: 2,
            name: 'iPhone 15',
            sku: 'APPLE-IP15-001',
            price: 999,
            category: 'Phones',
            inStock: false,
            image: '/products/iphone.jpg'
        }
    ];
    let selectedProduct = null;
    let productSearch = "";
    
    // Custom filter to only show in-stock items
    function filterInStockProducts(items, query) {
        return items.filter(item => 
            item.inStock && 
            (
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.sku.toLowerCase().includes(query.toLowerCase()) ||
                item.category.toLowerCase().includes(query.toLowerCase())
            )
        );
    }
</script>

<SearchSuggest
    data={products}
    displayField="name"
    searchFields={["name", "sku", "category"]}
    selectedItem={selectedProduct}
    searchQuery={productSearch}
    label="Choose Product"
    placeholder="Search by name, SKU, or category..."
    customFilter={filterInStockProducts}
    onselect={(product) => {
        selectedProduct = product;
        productSearch = "";
    }}
    onclear={() => {
        selectedProduct = null;
        productSearch = "";
    }}
    onsearch={(query) => productSearch = query}
>
    {#snippet itemRenderer(product, isSelected)}
        <div class="flex items-center gap-3">
            <img 
                src={product.image} 
                alt={product.name} 
                class="w-10 h-10 rounded object-cover"
            />
            <div class="flex-1">
                <div class="flex items-center gap-2">
                    <span class="font-medium {isSelected ? 'text-blue-700' : ''}">{product.name}</span>
                    {#if product.inStock}
                        <span class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">In Stock</span>
                    {:else}
                        <span class="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                    {/if}
                </div>
                <div class="text-xs text-zinc-500">{product.sku} • ${product.price} • {product.category}</div>
            </div>
        </div>
    {/snippet}
</SearchSuggest>
```

### 4. Country/Location Selector
```svelte
<script>
    let countries = [
        { code: 'US', name: 'United States', flag: '🇺🇸', continent: 'North America' },
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', continent: 'Europe' },
        { code: 'JP', name: 'Japan', flag: '🇯🇵', continent: 'Asia' },
        { code: 'AU', name: 'Australia', flag: '🇦🇺', continent: 'Oceania' }
    ];
    let selectedCountry = null;
    let countrySearch = "";
</script>

<SearchSuggest
    data={countries}
    displayField="name"
    searchFields={["name", "code", "continent"]}
    selectedItem={selectedCountry}
    searchQuery={countrySearch}
    label="Select Country"
    placeholder="Search by name, code, or continent..."
    getItemKey={(country) => country.code}
    onselect={(country) => {
        selectedCountry = country;
        countrySearch = "";
    }}
    onclear={() => {
        selectedCountry = null;
        countrySearch = "";
    }}
    onsearch={(query) => countrySearch = query}
>
    {#snippet itemRenderer(country, isSelected)}
        <div class="flex items-center gap-3">
            <span class="text-2xl">{country.flag}</span>
            <div>
                <div class="font-medium {isSelected ? 'text-blue-700' : ''}">{country.name}</div>
                <div class="text-xs text-zinc-500">{country.code} • {country.continent}</div>
            </div>
        </div>
    {/snippet}
</SearchSuggest>
```

## Configuration Examples

### 5. Required Field with Custom Messages
```svelte
<SearchSuggest
    data={categories}
    displayField="name"
    selectedItem={selectedCategory}
    label="Category"
    required={true}
    emptyMessage="No categories configured"
    noResultsMessage="No categories match your search"
    placeholder="Category is required..."
    onselect={(category) => selectedCategory = category}
/>
```

### 6. Disabled State
```svelte
<SearchSuggest
    data={options}
    displayField="label"
    selectedItem={selectedOption}
    label="Options"
    disabled={isLoading}
    placeholder={isLoading ? "Loading options..." : "Choose an option"}
    onselect={(option) => selectedOption = option}
/>
```

### 7. Non-clearable Selection
```svelte
<SearchSuggest
    data={requiredOptions}
    displayField="name"
    selectedItem={mandatorySelection}
    label="Required Selection"
    clearable={false}
    onselect={(option) => mandatorySelection = option}
/>
```

## Real-World Use Cases

### 8. Tag/Label Assignment
```svelte
<script>
    let tags = [
        { id: 1, name: 'urgent', color: '#ef4444', count: 23 },
        { id: 2, name: 'bug', color: '#f97316', count: 45 },
        { id: 3, name: 'feature', color: '#10b981', count: 12 }
    ];
    let selectedTag = null;
    let tagSearch = "";
</script>

<SearchSuggest
    data={tags}
    displayField="name"
    searchFields={["name"]}
    selectedItem={selectedTag}
    searchQuery={tagSearch}
    label="Add Tag"
    placeholder="Search tags..."
    maxHeight="8rem"
    onselect={(tag) => {
        // Add tag logic here
        console.log('Adding tag:', tag);
        selectedTag = null;
        tagSearch = "";
    }}
    onsearch={(query) => tagSearch = query}
>
    {#snippet itemRenderer(tag, isSelected)}
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <div 
                    class="w-3 h-3 rounded-full" 
                    style="background-color: {tag.color}"
                ></div>
                <span class="font-medium {isSelected ? 'text-blue-700' : ''}">{tag.name}</span>
            </div>
            <span class="text-xs text-zinc-400">{tag.count} uses</span>
        </div>
    {/snippet}
</SearchSuggest>
```

### 9. File/Document Selector
```svelte
<script>
    let documents = [
        {
            id: 1,
            name: 'Project Proposal.pdf',
            type: 'pdf',
            size: '2.3 MB',
            modified: '2024-01-15',
            path: '/documents/proposals/'
        },
        {
            id: 2,
            name: 'Meeting Notes.docx',
            type: 'docx',
            size: '145 KB',
            modified: '2024-01-14',
            path: '/documents/meetings/'
        }
    ];
    let selectedDocument = null;
    let docSearch = "";
    
    function getFileIcon(type) {
        const icons = {
            pdf: 'mdi:file-pdf-box',
            docx: 'mdi:file-word-box',
            xlsx: 'mdi:file-excel-box',
            default: 'mdi:file-document-outline'
        };
        return icons[type] || icons.default;
    }
</script>

<SearchSuggest
    data={documents}
    displayField="name"
    searchFields={["name", "type", "path"]}
    selectedItem={selectedDocument}
    searchQuery={docSearch}
    label="Select Document"
    placeholder="Search documents..."
    onselect={(doc) => {
        selectedDocument = doc;
        docSearch = "";
    }}
    onclear={() => {
        selectedDocument = null;
        docSearch = "";
    }}
    onsearch={(query) => docSearch = query}
>
    {#snippet itemRenderer(doc, isSelected)}
        <div class="flex items-center gap-3">
            <Icon icon={getFileIcon(doc.type)} class="text-xl text-zinc-500" />
            <div class="flex-1">
                <div class="font-medium {isSelected ? 'text-blue-700' : ''}">{doc.name}</div>
                <div class="text-xs text-zinc-500">{doc.size} • Modified {doc.modified}</div>
            </div>
        </div>
    {/snippet}
</SearchSuggest>
```

### 10. Multi-Language Support
```svelte
<script>
    let languages = [
        { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
        { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
        { code: 'zh', name: 'Chinese', nativeName: '中文', isRTL: false }
    ];
    let selectedLanguage = null;
    let langSearch = "";
</script>

<SearchSuggest
    data={languages}
    displayField="name"
    searchFields={["name", "nativeName", "code"]}
    selectedItem={selectedLanguage}
    searchQuery={langSearch}
    label="Language"
    placeholder="Search languages..."
    getItemKey={(lang) => lang.code}
    onselect={(lang) => {
        selectedLanguage = lang;
        langSearch = "";
    }}
    onclear={() => {
        selectedLanguage = null;
        langSearch = "";
    }}
    onsearch={(query) => langSearch = query}
>
    {#snippet itemRenderer(lang, isSelected)}
        <div class="flex items-center justify-between">
            <div>
                <div class="font-medium {isSelected ? 'text-blue-700' : ''}">{lang.name}</div>
                <div class="text-sm text-zinc-500" dir={lang.isRTL ? 'rtl' : 'ltr'}>
                    {lang.nativeName}
                </div>
            </div>
            <span class="text-xs text-zinc-400 font-mono">{lang.code.toUpperCase()}</span>
        </div>
    {/snippet}
</SearchSuggest>
```

## Integration Patterns

### Form Integration
```svelte
<form onsubmit={handleSubmit}>
    <SearchSuggest
        data={customers}
        displayField="companyName"
        selectedItem={formData.customer}
        label="Customer"
        required={true}
        onselect={(customer) => formData.customer = customer}
    />
    
    <button type="submit" disabled={!formData.customer}>
        Submit Order
    </button>
</form>
```

### Dynamic Data Loading
```svelte
<script>
    let searchResults = [];
    let isLoading = false;
    
    async function handleSearch(query) {
        if (query.length < 2) return;
        
        isLoading = true;
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            searchResults = await response.json();
        } finally {
            isLoading = false;
        }
    }
</script>

<SearchSuggest
    data={searchResults}
    displayField="title"
    selectedItem={selectedItem}
    placeholder={isLoading ? "Searching..." : "Type to search..."}
    disabled={isLoading}
    onsearch={handleSearch}
    onselect={(item) => selectedItem = item}
/>
```

These examples demonstrate the flexibility and power of the SearchSuggest component. It can be adapted to work with any data structure and provides extensive customization options for different use cases.