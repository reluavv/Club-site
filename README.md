# ReLU Club Website

This is the official website for the ReLU AI/ML Club, rebuilt with Next.js and Tailwind CSS.

## 🚀 Getting Started

### Prerequisites

You need **Node.js 18+** installed.

### Installation

1.  Refer to `legacy_static` if you need to see the old site.
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

*   `src/app`: Pages (Home, About, Announcements, Contact).
*   `src/components`: Reusable UI components.
    *   `layout`: Navbar.
    *   `ui`: StarBackground, Timeline, TeamMember.
*   `src/lib`: Data and utility functions.
*   `public`: Static images.

## ☁️ Deployment on Google Cloud Platform (GCP)

This project is configured for deployment on **Cloud Run**.

### Step 1: GCP Setup
1.  Create a GCP Project.
2.  Enable **Cloud Run API** and **Cloud Build API**.
3.  Install **Google Cloud SDK** locally if you want to deploy from terminal.

### Step 2: Build & Deploy using Cloud Build
The included `cloudbuild.yaml` handles building the Docker image and deploying it.

1.  Connect this repository to Cloud Build (via GitHub Trigger) OR submit a build manually:
    ```bash
    gcloud builds submit --config cloudbuild.yaml .
    ```
    *(Make sure you are authenticated with `gcloud auth login` and `gcloud config set project YOUR_PROJECT_ID`)*

### Step 3: Manual Deployment (Alternative)
1.  Build the Docker image:
    ```bash
    docker build -t gcr.io/[PROJECT-ID]/relu-website .
    ```
2.  Push to Google Container Registry:
    ```bash
    docker push gcr.io/[PROJECT-ID]/relu-website
    ```
3.  Deploy to Cloud Run:
    ```bash
    gcloud run deploy relu-website --image gcr.io/[PROJECT-ID]/relu-website --platform managed
    ```

## 🛠 Features
*   **Dynamic Data**: Team members and Events are loaded from `src/lib/data.ts` (can be connected to a DB later).
*   **Contact Form**: Submits to `/api/contact` (currently logs to console, ready for Email API integration).
*   **Star Animation**: Ported from legacy JS to a React Component (`StarBackground`).
*   **Timeline**: Custom Timeline component with scroll interaction.
