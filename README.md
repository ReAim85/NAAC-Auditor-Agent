# NAAC Automated Audit System
A specialised document verification platform designed to automate the auditing process for NAAC (National Assessment and Accreditation Council) accreditation. This system integrates **Google Drive** for file management and Google **Gemini 2.5 Flash (Vision)** to strictly verify institutional documents against the 7 NAAC Criteria.

## Project Overview
This tool solves the manual inefficiency of checking thousands of SSR (Self-Study Report) documents. It recursively scans institutional drive folders, parses files (PDFs/Images), and uses a Multimodal LLM to verify:

* Mandatory Attributes: Principal signatures, Institutional seals, and dates within the 5-year assessment window.

* Compliance: Checks against specific sub-criteria (e.g., 1.1.1, 7.1.3) defined in a rigorous backend master checklist.

## Key Features
* **OAuth 2.0 Authentication**: Secure integration with Google Drive.

* **Recursive File Crawler**: Automatically maps nested folder structures of any depth.

* **AI Vision Auditing**: Uses Gemini 2.5 Flash to visually inspect documents for stamps and signatures, not just text.

* **Dynamic Criteria Selection**: Backend-driven rules engine that populates criteria/sub-criteria dropdowns dynamically.

* **Compliance Reporting**: Generates detailed JSON reports highlighting "Missing Elements" and "Confidence Scores."

## Technology Stack
* **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion

* **Backend**: Node.js, Express.js

* **AI/ML**: Google Gemini 2.5 Flash (via Google Generative AI SDK)

* **Services**: Google Drive API v3

## Prerequisites
Before running the system, ensure you have:

* Node.js (v18 or higher)

* A Google Cloud Project with Drive API enabled.

* A Google AI Studio API Key (for Gemini).

## Installation & Setup
### 1. Clone the Repository
```
git `clone` https://github.com/yourusername/naac-audit-system.git
cd naac-audit-system
```
### 2. Backend Setup
Navigate to the backend directory and install dependencies:
Bash
```
cd naac_doc_parser_be
npm install
```
Create a .env file in the backend root with the following credentials:
```
PORT=3000
#Google Cloud Console Credentials
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Google AI Studio Key
GEMINI_API_KEY=your_gemini_api_key
```
Start the backend server:
```
node server.js
```
The server will run on `http://localhost:3000`
### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```
cd frontend
npm install
```
Start the development server:
```
npm run dev
```
The application will launch on `http://localhost:5173`

## Usage Guide
1. **Authenticate**: Open the application. If not logged in, you will be redirected to the Google OAuth consent screen.

2. **Select File**: Use the file explorer on the left to navigate your Drive folders and select a document (PDF/Image).

3. **Select Criteria**:

* Choose the **NAAC Criterion** (e.g., Criterion 1: Curricular Aspects).

* Choose the specific **Metric** (e.g., 1.1.1 Curriculum Delivery).

4. **Run Audit**: Click "Run Compliance Check."

5. **View Report**: The system will display a compliance status (Compliant/Non-Compliant), missing mandatory elements, and AI reasoning.

## Architecture
The system follows a strict **Backend-Source-of-Truth** architecture:

* **Master Rules** (master-checklist.json): All NAAC logic, mandatory document lists, and verification rules are stored securely on the backend.

* **Gap Analysis**: The frontend is a presentation layer; the actual comparison between "Files Found" vs "Files Required" happens on the server to ensure integrity.

## License
Copyright (C) 2026 Vishal Jha

This program is free software: you can redistribute it and/or modify it under the terms of the **GNU Affero General Public License** as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

## Author
**Vishal Jha**

* **Role**: Lead Developer & Architect

* **Contact**: visual19852004@gmail.com

Institution: IILM University, Gurugram

---
*Disclaimer: This software is an assistive tool for preliminary auditing. Final accreditation decisions remain with the NAAC Peer Team.*
