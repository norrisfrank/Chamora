# 🌟 Chamora

![Chamora Cover](https://via.placeholder.com/1200x400/1A4D2E/FFFFFF?text=Chamora+-+Chama+Management+System)

Chamora is a comprehensive management system designed specifically for **Chamas** (informal cooperative societies/investment groups). It simplifies group operations by handling member contributions, loan management, meeting minutes, and financial tracking in a streamlined, real-time dashboard.

## ✨ Features
- **👥 Member Management**: Seamlessly add, manage, and track group members and their roles (Admin, Treasurer, Member).
- **💰 Contribution Tracking**: Record member savings, monthly contributions, and welfare dues.
- **🏦 Loan Management**: Members can request loans, and administrators can track disbursements, interest rates, and repayments.
- **📅 Meetings & Minutes**: Schedule events, send reminders, and archive detailed meeting minutes.
- **📊 Real-time Analytics**: Built with Socket.IO for real-time dashboard updates of total savings, active loans, and performance metrics.
- **📱 M-Pesa Integration**: First-class support for Safaricom Daraja STK push to seamlessly collect and track payments.

---

## 🛠️ Technology Stack
**Backend**:
- Node.js & Express.js
- PostgreSQL (Primary Database)
- Socket.IO (Real-time events)
- JWT (Authentication)

**Frontend**:
- HTML5, CSS3, Vanilla Javascript
- Responsive "Glassmorphism" Design Language

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) database

### 2. Install Dependencies
Clone the repository and install the backend/frontend dependencies:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory based on `.env.example`. You will need:
```env
# Core Systems
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/chamora
JWT_SECRET=your_super_secret_jwt_string

# M-Pesa Daraja Integration (Optional for local testing)
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/contributions/mpesa/callback
```

### 4. Database Setup
Once your `DATABASE_URL` is configured, run the setup script to generate the required tables:
```bash
npm run setup:db
```

### 5. Run the Application
Start the development server:
```bash
npm run dev
```
The application will be universally available at `http://localhost:5000`. 

---

## 🌐 Deployment
This unified Express architecture makes it extremely easy to deploy on platforms like Render or Heroku. 

1. Push your repository to GitHub.
2. Link the repository to Render as a "Web Service".
3. Use `npm install` for the Build Command and `npm run start` for the Start Command.
4. Attach a Render PostgreSQL database and inject the credentials into your Web Service Environment Variables.
5. In your local terminal, run `DATABASE_URL=<Render_DB_URL> npm run setup:db` to securely instantiate the cloud schema.

---

*Developed with ❤️ to empower investment groups everywhere.*
