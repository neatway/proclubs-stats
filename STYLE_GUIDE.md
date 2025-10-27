# PROCLUBS.IO Style Guide & Page Template

**Version:** 1.0
**Last Updated:** October 24, 2025

This document describes the design system, component patterns, and page structure used throughout the proclubs.io application.

---

## 📐 Design System

### **Color Palette**

#### Backgrounds
```css
--bg-page: #0A0A0A          /* Main page background - very dark */
--bg-primary: #1A1D29       /* Primary container background */
--bg-secondary: #252932     /* Secondary elements */
--bg-tertiary: #2F3341      /* Tertiary backgrounds */
--bg-card: #1E1E1E          /* Card backgrounds */
--bg-card-hover: #252525    /* Card hover state */
--bg-header: #0F0F0F        /* Header sections */
```

#### Brand Colors
```css
--brand-cyan: #00D9FF         /* Primary brand color */
--brand-cyan-hover: #33E3FF   /* Hover state */
--brand-cyan-pressed: #00B8D9 /* Pressed/active state */
--brand-cyan-subtle: rgba(0, 217, 255, 0.1) /* Subtle backgrounds */
```

#### Text Colors
```css
--text-primary: #FFFFFF      /* Primary text - white */
--text-secondary: #CACFD6    /* Secondary text - light gray */
--text-muted: #9CA3AF        /* Muted text - medium gray */
--text-disabled: #6B7280     /* Disabled text - dark gray */
```

#### Status Colors
```css
--success: #10B981    /* Green - success states */
--danger: #DC2626     /* Red - errors/losses */
--info: #3B82F6       /* Blue - information */
--warning: #F59E0B    /* Amber - warnings */
```

---

## 🎨 Typography

### **Font Families**

```css
/* Primary Sans-Serif - Work Sans */
font-family: 'var(--font-work-sans), sans-serif'
Weights: 400, 500, 600, 700

/* Display Font - Teko */
font-family: 'var(--font-teko), sans-serif'
Weight: 700
Use: Logo, large headers

/* Monospace - IBM Plex Mono */
font-family: 'IBM Plex Mono, monospace'
Weights: 400, 700
Use: Stats, numbers, records

/* Accent - Montserrat */
font-family: 'var(--font-montserrat), sans-serif'
Weight: 500
Use: Special headings
```

### **Typography Scale**

```css
/* Headers */
H1: clamp(48px, 7vw, 80px)  /* Main page titles */
H2: clamp(32px, 5vw, 48px)  /* Section titles */
H3: clamp(24px, 4vw, 36px)  /* Subsection titles */

/* Body */
Body Large: 18px
Body Regular: 16px
Body Small: 14px
Caption: 12px

/* Stats/Numbers */
Stat Large: clamp(56px, 7vw, 72px)
Stat Medium: clamp(32px, 4vw, 48px)
Stat Small: clamp(20px, 3vw, 28px)
```

### **Font Styling Patterns**

```tsx
// Page Title (Club Name)
style={{
  fontFamily: 'Work Sans, sans-serif',
  fontSize: 'clamp(48px, 7vw, 80px)',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  lineHeight: 1,
  color: '#FFFFFF',
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
}}

// Section Header
style={{
  fontFamily: 'Work Sans, sans-serif',
  fontSize: '18px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: '#9CA3AF',
  marginBottom: '16px'
}}

// Stat Number (W/D/L, ratings)
style={{
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 'clamp(28px, 4vw, 38px)',
  fontWeight: 400,
  color: '#CACFD6',
  textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
  wordSpacing: '-0.15em'
}}
```

---

## 📦 Layout Structure

### **Page Container**

Every page follows this structure:

```tsx
<main style={{
  minHeight: '100vh',
  padding: '24px',
  background: 'var(--bg-page)'  // #0A0A0A
}}>
  <div style={{
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0'
  }}>
    {/* Breadcrumb */}
    {/* Page Content */}
  </div>
</main>
```

**Key Points:**
- Main container: Dark background (#0A0A0A)
- Max width: 1400px
- Centered with auto margins
- 24px padding around edges (responsive)

---

## 🍞 Breadcrumb Navigation

**Always positioned OUTSIDE the blue containers:**

```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#9CA3AF',
  marginTop: '0px',
  marginBottom: '16px',
  fontFamily: 'Work Sans, sans-serif'
}}>
  <Link
    href="/"
    style={{
      color: '#9CA3AF',
      textDecoration: 'none',
      transition: 'color 0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
    onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
  >
    Home
  </Link>

  <span style={{ color: '#6B7280' }}>/</span>

  <span style={{ color: '#FFFFFF', fontWeight: 500 }}>
    Current Page
  </span>
</div>
```

**Spacing:**
- `marginTop: '0px'` - No top margin
- `marginBottom: '16px'` - 16px below before content sections

---

## 📦 Content Sections Container

All sections wrapped in a flex column with consistent gaps:

```tsx
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'  // 24px between each section
}}>
  {/* Section 1 */}
  {/* Section 2 */}
  {/* Section 3 */}
</div>
```

---

## 🎴 Card Components

### **Primary Card (Section Container)**

```tsx
<div style={{
  background: '#1D1D1D',
  padding: '16px 24px',
  borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
}}>
  {/* Content */}
</div>
```

**Properties:**
- Background: `#1D1D1D` (dark gray)
- Padding: `16px 24px` (vertical horizontal)
- Border radius: `16px` (rounded corners)
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.4)` (subtle depth)

### **Secondary Card (Nested Content)**

```tsx
<div style={{
  background: '#252525',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.05)'
}}>
  {/* Content */}
</div>
```

---

## 🏅 Header Section Pattern

The club page header demonstrates the standard pattern:

```tsx
<div className="club-info-header" style={{
  background: '#1D1D1D',
  padding: '16px 24px',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: 'clamp(16px, 3vw, 40px)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
}}>
  {/* Left: Image/Badge */}
  <img
    src={imageUrl}
    alt="Badge"
    style={{
      width: '180px',
      height: '180px',
      borderRadius: '12px',
      objectFit: 'cover',
      flexShrink: 0,
      filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))'
    }}
  />

  {/* Center: Title & Info */}
  <div style={{ flex: 1 }}>
    <h1 style={{
      fontFamily: 'Work Sans, sans-serif',
      fontSize: 'clamp(48px, 7vw, 80px)',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '2px',
      margin: '0 0 12px 0',
      lineHeight: 1,
      color: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
    }}>
      Title Here
    </h1>

    {/* Subtitle/stats */}
    <p style={{
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: 'clamp(28px, 4vw, 38px)',
      fontWeight: 400,
      color: '#CACFD6',
      margin: 0
    }}>
      Stats Here
    </p>
  </div>

  {/* Right: Additional Stats */}
  <div style={{ textAlign: 'right' }}>
    {/* Right-aligned content */}
  </div>
</div>
```

---

## 📊 Stats Display Patterns

### **Inline Stats (W/D/L Style)**

```tsx
<p style={{
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 'clamp(28px, 4vw, 38px)',
  fontWeight: 400,
  color: '#CACFD6',
  margin: 0,
  textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
  wordSpacing: '-0.15em'
}}>
  W <span style={{ fontWeight: 700, color: '#FFFFFF' }}>24</span>
  {' '}
  D <span style={{ fontWeight: 700, color: '#FFFFFF' }}>8</span>
  {' '}
  L <span style={{ fontWeight: 700, color: '#FFFFFF' }}>12</span>
</p>
```

### **Vertical Stat Block**

```tsx
<div style={{ textAlign: 'center' }}>
  <div style={{
    fontSize: '12px',
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#9CA3AF',
    marginBottom: '4px'
  }}>
    LABEL
  </div>
  <div style={{
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 'clamp(56px, 7vw, 72px)',
    fontWeight: 700,
    color: '#FFFFFF',
    lineHeight: 1
  }}>
    1234
  </div>
</div>
```

---

## 🖼️ Image Handling

### **Badge/Avatar Pattern**

```tsx
<img
  src={imageUrl}
  alt="Description"
  style={{
    width: '180px',
    height: '180px',
    borderRadius: '12px',
    objectFit: 'cover',
    flexShrink: 0,
    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))'
  }}
  loading="lazy"
  onError={(e) => {
    e.currentTarget.src = "fallback-url.png";
  }}
/>
```

**Key Points:**
- Always include `onError` handler
- Use `loading="lazy"` for performance
- Drop shadow for depth: `drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))`

---

## 📱 Responsive Design

### **Breakpoints**

```css
/* Mobile First Approach */
Mobile: default (< 640px)
Tablet: 640px - 767px
Desktop: 768px+
Large Desktop: 1024px+
Extra Large: 1280px+
```

### **Mobile Adaptations**

```css
/* Hide on mobile */
@media (max-width: 767px) {
  .desktop-only {
    display: none !important;
  }
}

/* Show only on mobile */
.mobile-only {
  display: none;
}

@media (max-width: 767px) {
  .mobile-only {
    display: block !important;
  }
}
```

### **Responsive Patterns**

```tsx
// Use clamp() for fluid sizing
fontSize: 'clamp(minSize, preferredSize, maxSize)'

// Example: scales from 48px to 80px based on viewport
fontSize: 'clamp(48px, 7vw, 80px)'

// Responsive gaps
gap: 'clamp(16px, 3vw, 40px)'

// Responsive padding
padding: 'var(--container-padding)'  // 16px → 24px → 32px
```

---

## 🎯 Interactive Elements

### **Button Styles**

```tsx
// Primary Button
<button style={{
  background: 'var(--brand-cyan)',
  color: '#000000',
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '14px',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}}>
  Button Text
</button>

// Secondary Button
<button style={{
  background: 'transparent',
  color: 'var(--brand-cyan)',
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '14px',
  border: '2px solid var(--brand-cyan)',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}}>
  Button Text
</button>
```

### **Link Hover Pattern**

```tsx
<Link
  href="/path"
  style={{
    color: '#9CA3AF',
    textDecoration: 'none',
    transition: 'color 0.2s'
  }}
  onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
  onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
>
  Link Text
</Link>
```

---

## 🔤 Text Effects

### **Text Shadow (Depth)**

```css
/* Light depth - labels */
text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2)

/* Medium depth - stats */
text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4)

/* Strong depth - titles */
text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5)
```

### **Drop Shadow (Images)**

```css
/* Subtle - badges */
filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))

/* Cyan glow */
filter: drop-shadow(0 0 8px rgba(0, 217, 255, 0.3))
```

---

## 📏 Spacing System

```css
--space-xs: 4px
--space-sm: 8px
--space-md: 16px (responsive)
--space-lg: 24px (responsive)
--space-xl: 32px (responsive)
--space-2xl: 48px (responsive)
--space-3xl: 64px
```

**Common Gaps:**
- Between sections: `24px`
- Between cards in grid: `16px`
- Between header elements: `clamp(16px, 3vw, 40px)`
- Breadcrumb spacing: `8px`

---

## 🎨 Page Template

Use this template as a starting point for new pages:

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PageName() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Fetch data
    const fetchData = async () => {
      try {
        setLoading(true);
        // API calls here
        setLoading(false);
      } catch (err) {
        setError("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px', background: 'var(--bg-page)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center', paddingTop: '100px' }}>
          <p style={{ color: '#9CA3AF', fontSize: '18px' }}>Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px', background: 'var(--bg-page)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center', paddingTop: '100px' }}>
          <p style={{ color: '#DC2626', fontSize: '18px', marginBottom: '16px' }}>{error}</p>
          <Link href="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '24px', background: 'var(--bg-page)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0' }}>

        {/* Breadcrumb - OUTSIDE containers */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#9CA3AF',
          marginTop: '0px',
          marginBottom: '16px',
          fontFamily: 'Work Sans, sans-serif'
        }}>
          <Link
            href="/"
            style={{ color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
          >
            Home
          </Link>
          <span style={{ color: '#6B7280' }}>/</span>
          <span style={{ color: '#FFFFFF', fontWeight: 500 }}>Page Name</span>
        </div>

        {/* All sections container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Header Section */}
          <div style={{
            background: '#1D1D1D',
            padding: '16px 24px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
          }}>
            <h1 style={{
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 'clamp(48px, 7vw, 80px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              margin: '0',
              lineHeight: 1,
              color: '#FFFFFF',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
            }}>
              Page Title
            </h1>
          </div>

          {/* Content Section */}
          <div style={{
            background: '#1D1D1D',
            padding: '16px 24px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Your content here */}
          </div>

        </div>
      </div>
    </main>
  );
}
```

---

## ✅ Checklist for New Pages

When creating a new page, ensure:

- [ ] Main container: `minHeight: '100vh'`, `padding: '24px'`, `background: 'var(--bg-page)'`
- [ ] Max width wrapper: `1400px` with centered margins
- [ ] Breadcrumb navigation positioned correctly (outside blue containers)
- [ ] All sections wrapped in flex column with `gap: '24px'`
- [ ] Cards use `#1D1D1D` background with `16px` border radius
- [ ] Headers use Work Sans with appropriate `clamp()` sizing
- [ ] Stats use IBM Plex Mono
- [ ] Images have `onError` handlers and lazy loading
- [ ] Responsive classes for mobile/desktop visibility
- [ ] Loading and error states implemented
- [ ] Proper text shadows and drop shadows for depth

---

**Reference Pages:**
- Club Page: `src/app/club/[clubId]/page.tsx`
- CSS Variables: `src/app/globals.css`
- Logo Component: `src/components/Logo.tsx`

**Last Updated:** October 24, 2025
