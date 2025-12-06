# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Epigraph Chronogrammer** is an educational tool for analyzing and generating chronograms—texts where Roman numerals (I, V, X, L, C, D, M) embedded in the text sum to encode a hidden year. This classical cryptography technique was popular in Renaissance and Baroque Europe (16th-18th centuries) for inscriptions and book publication dates.

The tool is a single-page web application with three main tabs:
1. **Analyze**: Extract Roman numerals from text and compute hidden years
2. **Generate**: Create chronogram-like sentences from a given year
3. **Study**: Educational content about chronogram history and applications

## Tech Stack

- Pure vanilla JavaScript (no frameworks)
- HTML5 + CSS3
- Static site deployed to GitHub Pages

## File Structure

- `index.html` - Main UI with tab navigation and form controls
- `script.js` - Core chronogram logic and UI event handlers
- `style.css` - Dark theme styling with CSS custom properties
- `README.md` - Japanese documentation with historical and security context
- `.nojekyll` - Disables Jekyll processing on GitHub Pages

## Key Architecture

### Roman Numeral System (`script.js:1-61`)

- `ROMAN_VALUES`: Mapping of letter to integer value (I=1, V=5, X=10, L=50, C=100, D=500, M=1000)
- `intToRoman()`: Converts integer year to canonical Roman numeral using subtractive notation (e.g., 2025 → MMXXV)
- `countLetters()`: Counts frequency of each Roman letter in a string
- `canFormFromCounts()`: Checks if a target year's Roman representation can be formed from available letters (supports `subset` and `exact` modes)

### Extraction Modes (`script.js:63-121`)

Three extraction modes are supported:
- **all**: Extract all Roman numeral letters (I, V, X, L, C, D, M) regardless of case
- **uppercase**: Only extract uppercase Roman letters (historical standard)
- **positional**: Extract letters at line start/end positions (acrostic-style)

### Two Analysis Methods

1. **Sum Method** (`script.js:183-213`): Historical approach—adds all Roman numeral values (supports both simple addition and subtractive notation)
2. **Anagram Method** (`script.js:216-227`): Searches for valid years (default 1500-2100) that can be formed by rearranging extracted letters

### UI Event Flow

- Tab switching: Updates `.active` class on both tab buttons and panels (`script.js:276-284`)
- `performAnalysis()` (`script.js:367-407`):
  1. Validate and sanitize input (max 10,000 chars)
  2. Highlight Roman letters in text based on extraction mode
  3. Extract and count letters
  4. Store extracted data for mode changes
  5. Call `updateResults()` to compute both methods
- `updateResults()` (`script.js:410-462`): Computes sum and anagram results, responds to mode changes in real-time
- Generate button (`script.js:507-566`): Creates sample sentences with the target year's Roman numerals dispersed and highlighted

## Development Commands

Since this is a static site with no build process:

- **Local development**: Open `index.html` directly in browser, or use a local server:
  ```bash
  python -m http.server 8000
  # or
  npx serve .
  ```
- **Deploy**: Push to `main` branch (GitHub Pages auto-deploys from root)

## Important Design Decisions

- **Year range 1500-2100**: Historical chronograms are most common from 1500s-1700s; upper bound extends to near future for educational purposes
- **Uppercase extraction default**: Historical chronograms typically used uppercase letters as significant; this is the default mode
- **No external dependencies**: Maximizes portability and educational clarity
- **Real-time mode switching**: Anagram mode (subset/exact) can be changed after analysis without re-running extraction
- **Input validation**: Text input limited to 10,000 characters to prevent DoS; year inputs validated for 1-9999 range

## Security Context

This tool demonstrates classical steganography—hiding information (year) in plain text. While cryptographically weak, it illustrates:
- Text-based information hiding
- Historical cryptography techniques
- Potential analogy to modern watermarking/steganography in AI-generated text

The README extensively discusses applications to security education, NLP constraint generation, and digital humanities.

## CSS Architecture

- CSS custom properties (`style.css:1-25`) define theme colors for dark/light modes
- Theme switching via `data-theme` attribute on body element
- Responsive breakpoint at 980px for mobile layout
