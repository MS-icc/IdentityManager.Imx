# Stage Themes – DEVL / QUAL / PROD

This guide explains how to create and deploy environment-specific themes for the IMX web portal.  
Each stage gets its own primary color and a non-intrusive stage badge, so users always know which environment they are working in.

## Color Matrix

| Stage | Primary Color | Badge | CSS class |
|-------|--------------|-------|-----------|
| **DEVL** | Corbin Orange `#f4770b` | `DEVL` (orange, top-right) | `devl-theme` |
| **QUAL** | Maui Purple  `#802981` | `QUAL` (purple, top-right) | `qual-theme` |
| **PROD** | Iris Blue    `#05aadb` | *(none – clean for end-users)* | `prod-theme` |

---

## Step 1 – Build the CSS files

Run the following commands from the `imxweb/custom-theme` directory.

```bash
# Build all three stage themes at once
npm run build:all-stages

# Or build individually
npm run build:devl
npm run build:qual
npm run build:prod
```

**Prerequisites**: Node.js ≥ 22 and `sass` available (`npm install` in the `imxweb` folder).

Each command produces a compiled `.css` file next to the corresponding `.scss` source in the `stages/` folder.

---

## Step 2 – Package each theme as a ZIP

Each theme requires its own ZIP file named `Html_<ThemeName>.zip`.

```
Html_DevlTheme.zip
  └── devl-theme.css          ← compiled CSS from stages/devl-theme.css

Html_QualTheme.zip
  └── qual-theme.css

Html_ProdTheme.zip
  └── prod-theme.css
```

> **Tip:** If you reference images or custom fonts inside the theme CSS, include those files in the same ZIP.

---

## Step 3 – Create the `imx-theme-config.json`

A ready-to-use template is provided at `stages/imx-theme-config.json`.  
It defines all three themes in a single file:

```json
{
  "Themes": [
    {
      "Name": "DevlTheme",
      "DisplayName": "Development",
      "Class": "devl-theme",
      "Urls": ["../Html_DevlTheme/devl-theme.css"]
    },
    {
      "Name": "QualTheme",
      "DisplayName": "Quality Assurance",
      "Class": "qual-theme",
      "Urls": ["../Html_QualTheme/qual-theme.css"]
    },
    {
      "Name": "ProdTheme",
      "DisplayName": "Production",
      "Class": "prod-theme",
      "Urls": ["../Html_ProdTheme/prod-theme.css"]
    }
  ]
}
```

---

## Step 4 – Deploy via Software Loader

1. Import each `Html_<ThemeName>.zip` into the One Identity Manager database using the **Software Loader**.
2. Import the `imx-theme-config.json` the same way.
3. Restart the **API Server**.

---

## Step 5 – Set the Default Theme per Environment

In the IMX **Configuration** (Designer or Admin portal), set:

| Configuration key | DEVL | QUAL | PROD |
|---|---|---|---|
| `DefaultHtmlTheme` | `devl-theme` | `qual-theme` | `prod-theme` |

This ensures the correct theme is applied automatically when a user first opens the portal, without requiring manual selection.

> If you want to **prevent users from switching** to a different theme, restrict access to the Theme Switcher control in the portal settings.

---

## Step 6 – Custom Logo (optional but recommended)

The masthead and login page both support a `CompanyLogoUrl` configuration key.  
Set this to a stable HTTPS URL pointing to your company logo (transparent PNG or SVG, max height ~50 px).

The same URL is used on both the **login page** and the **header masthead**.

```
CompanyLogoUrl = https://cdn.example.com/branding/company-logo.svg
```

This is a global setting – all three stages can share the same logo URL, or each stage can reference an environment-specific logo (e.g. with a "DEV" watermark).

---

## Accessibility & Best Practices

- **Contrast**: Verify that button text, links, and focus indicators meet WCAG AA contrast (4.5:1 for normal text).  
  Use a tool such as [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).
- **Dark/Light themes**: The stage themes are light-mode only. Users can still switch to the built-in dark/high-contrast themes via their profile settings.
- **Stage badge**: The `::after` pseudo-element badge is `pointer-events: none` and `user-select: none`, so it never interferes with clicks or keyboard navigation.
- **PROD theme**: No badge is shown in production to avoid confusing end-users. The distinct blue color still provides a clear visual difference from DEVL/QUAL.
- **Validate in DEVL first**: Always test theme changes in DEVL before promoting to QUAL or PROD. Check the login page, header, navigation, dialogs, and data tables.

---

## File Structure

```
imxweb/custom-theme/
├── custom-theme.scss          Generic template (unchanged)
├── package.json               Build scripts (build, build:devl, build:qual, build:prod, build:all-stages)
├── readme.md                  Original One Identity theming guide
├── STAGE-THEMES.md            This file
└── stages/
    ├── devl-theme.scss        DEVL SCSS source
    ├── qual-theme.scss        QUAL SCSS source
    ├── prod-theme.scss        PROD SCSS source
    └── imx-theme-config.json  Software Loader template
```
