# MJML Email Templates

This directory contains responsive email templates for the Archive application, built using MJML markup language.

## Templates

### UserRegistration.mjml

Notification template for new user signups.

**Purpose:** Notify administrators when a new user registers on the platform.

**Variables:**
- `{{PreviewText}}` - Email preview text (shown in inbox before opening)
- `{{EmailAddress}}` - The new user's email address
- `{{SignupDate}}` - Date and time of registration

**Usage Example:**
```csharp
var variables = new Dictionary<string, string>
{
    { "PreviewText", "New user registration" },
    { "EmailAddress", "newuser@example.com" },
    { "SignupDate", "January 15, 2025 at 10:30 AM" }
};

var html = await renderer.RenderTemplateAsync("UserRegistration", variables);
```

## Design System

### Colors
- **Primary Dark:** #18181b (zinc-900) - Buttons, headings, primary text
- **Background:** #fafafa - Page background with gradient accents
- **Text Colors:**
  - Primary: #18181b (zinc-900)
  - Secondary: #71717a (zinc-500)
  - Muted: #a1a1aa (zinc-400)
- **Borders:** rgba(228, 228, 231, 0.5) - Subtle border with transparency

### Typography
- **Primary Font:** Inter (sans-serif)
- **Monospace Font:** Space Mono - Used for email addresses and timestamps
- **Font Sizes:**
  - Heading: 24px, bold
  - Subheading: 14px
  - Body: 14px
  - Small: 12-13px
  - Footer: 11-12px

### Design Elements
- Rounded corners (16px for cards, 12px for inner elements)
- Gradient backgrounds: linear-gradient(135deg, #fafafa 0%, #f4f1f0 25%, #f0f4f8 50%, #fdf4f4 75%, #fafafa 100%)
- Subtle borders and shadows
- Clean, minimal aesthetic

## Template Structure

```
mjml/
├── _Layout.mjml                  # Base layout with header and footer
├── UserRegistration.mjml         # Content template for new user signup
├── UserRegistration_Complete.mjml # Standalone preview version (complete)
└── README.md                     # This file
```

### File Types Explained

**_Layout.mjml** - Base layout template
- Contains the email shell (`<mjml>`, `<mj-head>`, `<mj-body>`)
- Includes header with branding and footer
- Has a `{{Content}}` placeholder for injecting content
- Used by the template renderer to wrap all email templates

**UserRegistration.mjml** - Content template (NOT a complete MJML document)
- Contains only the email-specific content components
- Designed to be injected into the layout's `{{Content}}` placeholder
- Uses variables like `{{EmailAddress}}` and `{{SignupDate}}`
- Cannot be validated standalone - must be combined with layout

**UserRegistration_Complete.mjml** - Standalone complete template
- Combines layout and content into a single file
- Fully valid MJML document that can be previewed
- Useful for testing and development
- Sample data included (john.doe@example.com)
- Can be validated in MJML playground or CLI

### Which File to Use?

**For Development/Preview:**
Use `UserRegistration_Complete.mjml` to:
- Preview the email in MJML playground (https://mjml.io/try-it-live)
- Test with MJML CLI: `mjml UserRegistration_Complete.mjml -o preview.html`
- Validate the complete email structure

**For Production (C# Integration):**
Use the separate `_Layout.mjml` + `UserRegistration.mjml` with:
- `MjmlTemplateRenderer.RenderTemplateAsync("UserRegistration", variables)`
- The renderer combines layout and content automatically
- Variables are substituted at runtime

### Layout (_Layout.mjml)
The layout template provides:
- Header with Archive branding (logo + name)
- Content injection point via `{{Content}}`
- Footer with copyright and links
- Consistent styling across all emails

### Content Templates
Individual templates (like UserRegistration.mjml) contain:
- Email-specific content
- Variable placeholders
- Structured information presentation

## Rendering Templates

### Using MjmlTemplateRenderer (C#)

The templates integrate with the `MjmlTemplateRenderer` class:

```csharp
public interface IMjmlTemplateRenderer
{
    Task<string> RenderTemplateAsync(
        string templateName,
        IReadOnlyDictionary<string, string> variables,
        CancellationToken ct = default);
}
```

### Manual Compilation

**Option 1: Use the Complete Template (Recommended for testing)**

1. Install MJML CLI: `npm install -g mjml`
2. Compile the complete template:
   ```bash
   mjml UserRegistration_Complete.mjml -o preview.html
   ```
3. Open `preview.html` in your browser

**Option 2: Use Online Playground**

Upload `UserRegistration_Complete.mjml` to https://mjml.io/try-it-live

**Option 3: Manual Layout + Content Combination**

If you need to combine layout and content manually:
1. Copy content from `UserRegistration.mjml`
2. Replace `{{Content}}` in `_Layout.mjml` with the copied content
3. Replace variables with actual values
4. Compile the combined file

## Testing

### Preview Endpoint
Add a preview endpoint in development:

```csharp
app.MapGet("/admin/emails/preview/{template}", async (
    string template,
    IMjmlTemplateRenderer renderer) =>
{
    var sampleVariables = GetSampleVariables(template);
    var html = await renderer.RenderTemplateAsync(template, sampleVariables);
    return Results.Content(html, "text/html");
})
.RequireAuthorization("AdminOnly");
```

### Sample Variables
```csharp
private Dictionary<string, string> GetSampleVariables(string template) => template switch
{
    "UserRegistration" => new()
    {
        { "PreviewText", "New user registration" },
        { "EmailAddress", "john.doe@example.com" },
        { "SignupDate", DateTime.Now.ToString("MMMM d, yyyy 'at' h:mm tt" }
    },
    _ => new Dictionary<string, string>()
};
```

## Email Client Compatibility

These templates are designed to work across:
- Gmail (web, iOS, Android)
- Outlook (2016+, 365, web)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Other major email clients

MJML handles the complexity of cross-client rendering automatically.

## Resources

- [MJML Documentation](https://documentation.mjml.io/)
- [MJML Playground](https://mjml.io/try-it-live)
- [Mjml.Net GitHub](https://github.com/ArtZab/Mjml.Net)
- [Email Client Support Matrix](https://www.caniuseemail.com/)

## Maintenance

When updating templates:
1. Test in multiple email clients
2. Verify responsive behavior on mobile
3. Check that all variables are properly substituted
4. Ensure branding consistency with the web application
5. Update this README if adding new templates or variables