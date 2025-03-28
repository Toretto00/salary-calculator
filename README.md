# Salary Calculator

A full-stack application for HR departments to manage employees and calculate salaries.

## Features

- User authentication with JWT
- Employee management (CRUD operations)
- Salary calculation with various components:
  - Gross salary
  - Benefits & allowances
  - Insurance contributions
  - Tax calculations
  - Overtime pay
- Excel export for salary reports
- Security features (protected routes, auth token expiration)

## Tech Stack

- **Frontend**: React, React Router, Axios, TailwindCSS
- **Backend**: Express.js, JWT Authentication
- **Data Storage**: JSON files

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/salary-calculator.git
cd salary-calculator
```

2. Install backend dependencies

```bash
cd server
npm install
```

3. Install frontend dependencies

```bash
cd ../client
npm install
```

### Running the Application

1. Start the backend server

```bash
cd server
npm run dev
```

2. Start the frontend application

```bash
cd ../client
npm start
```

3. Open your browser and navigate to http://localhost:3000

## Project Structure

```
salary-calculator/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # Source code
│       ├── api/            # API service functions
│       ├── components/     # Reusable components
│       ├── contexts/       # React contexts
│       └── pages/          # Page components
│
└── server/                 # Express backend
    ├── data/               # JSON data storage
    ├── routes/             # API routes
    └── index.js            # Server entry point
```

## Salary Calculation

The application calculates salary based on:

- Gross salary (with probation adjustment if applicable)
- Working days and days off
- Dependents (for tax relief)
- Various allowances (food, clothes, parking, fuel, etc.)
- Insurance contributions based on Vietnamese regulations
- Tax levels according to Vietnamese tax law
- Overtime hours with different rates

## License

This project is licensed under the MIT License - see the LICENSE file for details.
