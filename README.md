# ZEAL CAMPUS
### Live Academic Dashboard

ZEAL CAMPUS brings student records, academic summaries and performance comparisons into one responsive web application. It connects to Google Sheets through a Google Apps Script API, so the dashboard reflects the connected dataset without manually editing the website.

Built with HTML, CSS and vanilla JavaScript, the project runs as a static website with no installation or build step.

## What you can do

### Academic overview
See the number of connected students, average Class 10 and Class 12 percentages, the leading semester performer and semester-level performance summaries. A leaderboard and data-derived insights help you explore the current records.

### Student directory
Search students by name or roll number, filter by performance band, sort columns and choose the number of records per page. Select a student to inspect their academic details, or export the current filtered records as CSV.

### Academic analytics
Compare the top 10 students using horizontal ranked bars with full names. View Class 10 and Class 12 cohort averages, their percentage-point difference, semester movement and the number of students below the attention threshold.

### Live data status
Check the API connection, record count, endpoint and last successful sync. Select **Sync now** after changing the source Google Sheet to retrieve updated records.

### Appearance
Switch between light and dark themes. The selected theme is saved in the browser, and the layout adapts to desktop and mobile screens.

## How it works

```text
Google Sheets
     ↓
Google Apps Script web app
     ↓ JSON response
JavaScript fetch and normalization
     ↓
Dashboard · Student directory · Analytics
```

When the website opens, it requests the current records from the configured API. JavaScript normalizes the response, calculates summary metrics and renders the interface. Search, filtering, sorting and pagination operate on the fetched records in the browser.

The application reads data from the source; it does not edit the Google Sheet. Refreshing is manual through **Sync now**, rather than continuous background polling. No sample student dataset is bundled.

## Technology

| Technology | Role |
| --- | --- |
| HTML5 | Page structure, navigation, tables and dialogs |
| CSS3 | Responsive layouts, cards, chart styling and themes |
| Vanilla JavaScript | API requests, state, calculations and interactions |
| SVG and HTML/CSS | Semester charts, rankings and comparison visuals |
| Google Sheets | Source academic records |
| Google Apps Script | JSON web API |
| Browser local storage | Saved theme preference |

## Getting started

1. Download this repository or clone it.
2. Open `index.html` in a modern browser, or serve the folder with a static web server.
3. Wait for the live records to load.
4. Use the sidebar to explore the overview, directory, analytics and data source.

Internet access is needed for the live API and Google Fonts. No package installation, account registration or frontend build is required.

## API integration

The existing endpoint is configured as `API_URL` in `script.js` and remains unchanged.

The response must be a JSON array with these fields:

| Field | Description |
| --- | --- |
| `srNo` | Serial number |
| `rollNo` | Student roll number |
| `name` | Student name |
| `tenth` | Class 10 percentage |
| `twelfth` | Class 12 percentage |
| `sem1` | Semester 1 score |
| `sem2` | Semester 2 score |

The Google Apps Script backend source is maintained separately and is not included here.

## Performance metrics

- **Semester average:** mean of the available numeric semester scores.
- **Excellent:** semester average of 8.0 or above.
- **Good:** semester average from 7.0 to below 8.0.
- **Needs attention:** semester average below 7.0.
- **School comparison:** cohort averages on a 0–100% scale; the difference is expressed in percentage points.
- **Academic index:** a custom weighted summary of performance bands using weights of 100%, 78% and 48%. It is not an official institutional assessment.

## Project structure

```text
├── index.html    # Application views and structure
├── style.css     # Visual system, themes and responsive layout
├── script.js     # API integration and application behavior
└── README.md     # Project documentation
```

## Hosting with GitHub Pages

Open **Settings → Pages**, choose **Deploy from a branch**, select **main** with **/ (root)** and save. GitHub will display the published address after deployment completes.

The same files can also be hosted on another static web hosting service.

## Verification status

The live API returned HTTP 200 with 10 records. Edge browser checks covered the dashboard count, visible top-10 rankings, theme switching, directory rows, empty search, excellent filtering, sorting interaction and horizontal overflow at a 390px viewport.

Multi-page pagination and the CSV download still require further end-to-end verification.

## About this project

ZEAL CAMPUS was developed as part of OE 1 coursework and is documented here as a working web application. The project name does not imply official college endorsement.

Student records are fetched at runtime and are not committed to this repository.
