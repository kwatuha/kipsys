# Logo Setup Instructions

## Where to Place Your Logo

To use your hospital logo throughout the application, place your logo file in the `public` directory with one of these names:

- `logo.png` (recommended - PNG format with transparency)
- `logo.svg` (SVG format - scalable vector graphics)

## Supported Formats

The application will automatically try to load:
1. `/logo.png` (first priority)
2. `/logo.svg` (fallback if PNG not found)

## Logo Usage

The logo will automatically appear in:

1. **Login Page** - Displayed at the top of the login form
2. **Payment Receipts** - Printed receipts for patient payments
3. **Invoices** - Patient billing invoices
4. **Grouped Payment Receipts** - Batch payment receipts
5. **Vendor Invoices** - Accounts payable invoices
6. **Pharmacy Reports** - Drug inventory summaries
7. **Other Printed Documents** - All print templates

## Logo Specifications

For best results:
- **Recommended size**: 150-200px width
- **Format**: PNG with transparency or SVG
- **Aspect ratio**: Maintain original proportions
- **File size**: Keep under 500KB for fast loading

## Fallback Behavior

If no logo file is found, the application will automatically display:
- "KIPLOMBE" text in bold
- "Medical Centre" subtitle
- This ensures documents always have branding even without a logo file

## Testing

After placing your logo file:
1. Refresh your browser (hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`)
2. Check the login page to see if the logo appears
3. Print a test receipt or invoice to verify logo appears in printed documents


