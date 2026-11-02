# ZEAL CAMPUS — OE 1 Academic Dashboard

A live academic dashboard developed as an **OE 1 experiment**, using HTML, CSS, JavaScript, Google Sheets and a Google Apps Script JSON API.

## Experiment

**Title:** Design and implementation of a responsive academic dashboard with live Google Sheets integration.

**Aim:** Build a working web application that retrieves academic records from an API, summarizes student performance and supports searching, filtering, sorting and exporting records.

## Implemented features

- Dashboard with student count, school averages and leading semester performer
- Student directory with name/roll search, performance filters, sorting and pagination
- Individual student detail dialog and CSV export
- Horizontal top-10 semester ranking with full student names
- Class 10 and Class 12 average comparison with percentage-point difference
- Semester analytics, API connection status and manual refresh
- Responsive desktop/mobile interface and persistent light/dark theme

## Technology and data flow

Google Sheets → Google Apps Script → JSON API → JavaScript → dashboard and directory.

The frontend uses no build tools or login. Data is fetched from the existing endpoint; no fallback student dataset is bundled.

The endpoint remains unchanged in `script.js`. Expected fields are `srNo`, `rollNo`, `name`, `tenth`, `twelfth`, `sem1` and `sem2`.

## Run locally

Download or clone this repository and open `index.html` in a modern browser. Internet access is required for the live API and Google Fonts. For hosted use, serve the files through any static web host.

## GitHub Pages

In repository Settings → Pages, choose **Deploy from a branch**, select **main** and **/ (root)**, then save. GitHub will display the website URL once deployment finishes.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Application structure and views |
| `style.css` | Responsive layout, themes and visual design |
| `script.js` | API integration, calculations and interactions |

## Calculations

Semester average uses available numeric semester scores. Excellent means average ≥ 8; good means 7 ≤ average < 8; attention means average < 7. The academic index uses weighted performance bands (100%, 78%, 48%); it is a custom summary, not an official institutional measure. School comparison uses cohort averages on a 0–100% scale.

## Verification

Live API returned HTTP 200 and 10 records. Edge checks confirmed dashboard count, 10 visible ranking entries, theme switching, directory rows, empty search, excellent filtering, sorting interaction and no page overflow at 390px. The V7.1 chart fix ensures hidden canvases cannot displace the rendered charts.

Multi-page pagination and CSV download require further end-to-end verification. This repository does not contain the Google Apps Script backend source.

## Result

Implemented a responsive OE 1 academic dashboard that reads live records and provides academic summaries, comparisons and directory tools. Update the source Sheet and select **Sync now** to load current records.

## Project notes

ZEAL CAMPUS is the project name; this repository does not claim official college endorsement. Only publish academic records you are authorized to expose through the source API. No student records are stored in this repository.
