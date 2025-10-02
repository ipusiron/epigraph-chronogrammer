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

### Roman Numeral System (`script.js:1-50`)

- `ROMAN_VALUES`: Mapping of letter to integer value (I=1, V=5, X=10, L=50, C=100, D=500, M=1000)
- `intToRoman()`: Converts integer year to canonical Roman numeral using subtractive notation (e.g., 2025 → MMXXV)
- `countLetters()`: Counts frequency of each Roman letter in a string
- `canFormFromCounts()`: Checks if a target year's Roman representation can be formed from available letters (anagram logic)

### Two Analysis Methods

1. **Sum Method** (`script.js:85-95`): Historical approach—simply adds all Roman numeral values in order
2. **Anagram Method** (`script.js:97-109`): Searches for valid years (default 1500-2100) that can be formed by rearranging extracted letters

### UI Event Flow

- Tab switching: Updates `.active` class on both tab buttons and panels (`script.js:115-124`)
- Analyze button (`script.js:127-175`):
  1. Extract Roman letters from input text
  2. Display highlighted version of text
  3. Show letter counts
  4. Compute sum method result
  5. If anagram enabled, search year range for valid candidates
- Generate button (`script.js:203-228`): Creates 5 sample sentences with the target year's Roman numerals dispersed and highlighted

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
- **Anagram ON by default**: More interesting pedagogically than simple summation
- **No external dependencies**: Maximizes portability and educational clarity
- **Uppercase-only option**: Some historical chronograms used only uppercase letters as significant

## Security Context

This tool demonstrates classical steganography—hiding information (year) in plain text. While cryptographically weak, it illustrates:
- Text-based information hiding
- Historical cryptography techniques
- Potential analogy to modern watermarking/steganography in AI-generated text

The README extensively discusses applications to security education, NLP constraint generation, and digital humanities.
