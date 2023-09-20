# OutboxGPT - Email Sending Service with Campaign Integration(Backend)

OutboxGPT is a powerful email sending service that provides seamless integration with Google GAPI and Microsoft Outlook Graph. This README file will guide you through the installation, setup, and usage of the OutboxGPT service.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)

## Features
- Composing emails using Google GAPI and Microsoft Outlook Graph
- Integrated campaign management system
- Login functionality using Firebase authentication
- Payment processing with Stripe Elements and Hooks

## Prerequisites
Before installing and setting up OutboxGPT, make sure you have the following prerequisites:

- Node.js (version 18 or above)
- npm (Node Package Manager)
- Mongo DB
- SMTP server for System emails
- Firebase account (for authentication)
- Stripe account (for payment processing)
- Google GAPI credentials (for Gmail integration)
- Microsoft Outlook Graph API credentials (for Outlook integration)

## Installation
To install OutboxGPT, follow these steps:

1. Clone the repository:
   ```bash
   git clone git@bitbucket.org:CyphaDevelop/emailwriter_be.git
   ```

2. Navigate to the project directory:
    ```bash
    cd emailwriter_be
    ```

3. Install the dependencies:
    ```bash
    npm install
    ```

4. Run service
    ```bash
    # Starting server
    npm run start

    # Starting dev server
    npm run dev

    # With specific env
    NODE_ENV=prod npm run dev

    # With deamon mode using pm2
    pm2 startOrRestart echosystem.config.js --only outbox-prod
    ```

## Environment Variables
Configure Google Project, Miscrosoft Azure App, Firebase and Stripe

1. Google Project
    - Create Google Project in Console
    - Enable Email service
    - Create OAuth 2.0 Client ID with assosiated whitelisted domains  
    - Download config in `./src/config/google.json`

2. Firebase Project
    - Create Project
    - Enable Signin methods (Google)
    - Whitelist associated domains
    - Download config in `./src/config/firebase.json`

3. MS Azure Project
    - Create Project
    - Select Scopes
        ```
        openid profile offline_access User.Read Mail.Read email Mail.ReadBasic Mail.ReadWrite Mail.Send
        ```
    - Set env variables
        ```
        # MSAL creds
        MSAL_CLIENT_ID="xxxxxxxxxxxx-ac21-4670-b99c-xxxxxxxxxxxx"
        MSAL_CLIENT_SECRET="mW_8Q~xxxxxxxxxxxx.xxxxxxxxxxxx"
        ```
4. Mongo DB
    - Change env variable
        ```
        MONGO_URI="mongodb+srv://xxx:xxx@cluster0.b0cpal1.mongodb.net/xxx?retryWrites=true&w=majority"
        ```
5. SMTP server creds for system emails
    - Change env variables
        ```
        SYSTEM_EMAIL_FROM_NAME="Ai Email Writer"
        SYSTEM_EMAIL_FROM_EMAIL="ai.email@gmail.com"
        DEFAULT_SMTP_HOST="smtp.gmail.com"
        DEFAULT_SMTP_PORT=587
        DEFAULT_SMTP_USER="xyz@codiste.com"
        DEFAULT_SMTP_PASS="xxxxxxxxxxxxxxx"
        ```
6. Stripe 
    - Change env variables
        ```
        # Stripe key
        STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        ```
