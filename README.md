# Rengastarkastus 3.0 - Modular Architecture

## Project Structure

The application has been refactored into separate, maintainable modules:

### Core Modules

- **`storage.js`** - Storage and data persistence
  - Storage key definitions (`_StorageKeys`)
  - Basic storage functions (`loadList`, `saveList`, `loadMap`, `saveMap`)
  - Data managers (`ConfigManager`, `HistoryManager`)

- **`constants.js`** - Application constants
  - Vehicle type presets (`VEHICLE_PRESETS`)
  - Axle configurations for different vehicle types

- **`formatters.js`** - Data formatting utilities
  - `formatTyreSize()` - Normalize tyre sizes to XXX/XXRXX.X format
  - `capitalizeWords()` - Capitalize text with Finnish locale support
  - `formatMmValue()` - Format measurement values

- **`autocomplete.js`** - Autocomplete functionality
  - `setupAutocomplete()` - Generic autocomplete setup
  - `setupTyreAutocomplete()` - Specialized autocomplete for tyre data

- **`ui-builder.js`** - UI component builders
  - `buildAxleUI()` - Create axle configuration cards
  - `buildPositions()` - Generate tyre position labels
  - `buildMeasurementUI()` - Build measurement modal and tyre diagram
  - `renderHistory()` - Render inspection history and reports list

- **`pdf-renderer.js`** - PDF report generation
  - `drawTireDiagram()` - Draw visual tyre diagram with color coding
  - `buildDiagramHtml()` - HTML version of tyre diagram
  - `drawTable()` - Draw tables with text wrapping and vertical centering
  - `drawSectionTitle()` - Draw section headers
  - `drawKeyValues()` - Draw key-value pairs
  - `drawPhotoGallery()` - Embed photos in PDF
  - `renderReport()` - Generate complete report
  - `generatePdf()` - Export single inspection to PDF
  - `generateCompanyPdf()` - Export company reports
  - `generateVehiclePdf()` - Export vehicle reports

### Supporting Files

- **`index.html`** - Main HTML entry point with:
  - HTML structure for all views
  - Modular script imports
  - Main application initialization and event handlers
  - DOM element references and state management

- **`styles.css`** - All styling (unchanged)

- **`jspdf.umd.min.js`** - jsPDF library for PDF generation

- **`generate-product-catalog.ps1`** - Converts `tuotteet.xlsx` into browser-readable product JSON

- **`product-catalog.json`** - Generated tyre/rim catalog in JSON format

- **`product-catalog.js`** - Browser-loadable version of the generated catalog for local `file://` use

## How to Load

The application loads modules in this order:

1. `jspdf.umd.min.js` - External PDF library
2. `storage.js` - Data layer
3. `constants.js` - Configuration data
4. `formatters.js` - Utilities
5. `autocomplete.js` - UI helpers
6. `ui-builder.js` - UI components
7. `pdf-renderer.js` - Reporting
8. Main script in `index.html` - Application logic

If `tuotteet.xlsx` changes, regenerate the imported product catalog with:

```powershell
pwsh ./generate-product-catalog.ps1
```

If PowerShell 7 is not installed, Windows PowerShell also works:

```powershell
powershell -ExecutionPolicy Bypass -File .\generate-product-catalog.ps1
```

The generated catalog currently feeds:

- tyre size autocomplete
- tyre make/model autocomplete
- ET value autocomplete derived from rim products

The full rim product list is also stored in the generated JSON for later UI use.

All modules export functions and classes to the global `window` object for easy access from the main application script.

## Key Features

- **Data Persistence**: localStorage-based storage with nested data structures
- **Modular Design**: Each module has a single responsibility
- **Text Wrapping**: Table cells expand vertically to fit content
- **Color-Coded Visuals**: Tyre diagram uses color coding (red ≤5mm, yellow 6-9mm, green ≥10mm)
- **Finnish Support**: Proper capitalization and locale-aware formatting
- **Responsive Reports**: Both PDF and HTML fallback for report generation

## Maintenance

- Add new formatting rules to `formatters.js`
- Extend UI components in `ui-builder.js`
- Modify PDF layout in `pdf-renderer.js`
- Add storage features to `storage.js`

Each module is independent and can be modified without affecting others.
