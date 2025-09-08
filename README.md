RetroRelics
RetroRelics is a multivendor e-commerce platform designed for buying and selling retro, vintage, and antique products. Built as a web development learning project, it leverages modern technologies to provide a seamless experience for users and vendors, with features like secure payments, dashboards, and email notifications.
Features

Multivendor Model: Allows multiple vendors to list and sell their retro, vintage, and antique products.
User Dashboard: Enables users to browse products, manage their cart, and track orders.
Vendor Dashboard: Provides vendors with tools to manage their product listings, view sales, and track orders.
Payment Integration: Supports secure payments via PayPal and Razorpay.
Email Notifications: Sends automated emails to users and vendors upon successful sales.
Admin Interface: Utilizes Jazzmin for a customizable and user-friendly admin panel for managing the platform.
Responsive Design: Styled with Tailwind CSS for a modern, responsive user interface.
State Management: Uses Zustand for efficient state management in the React frontend.

Tech Stack

Backend: Django (Python web framework)
Frontend: React (JavaScript library with Vite)
State Management: Zustand
Styling: Tailwind CSS
Payment Gateways: PayPal, Razorpay
Admin Panel: Jazzmin (Django admin theme)
Database: SQLite (default for development; can be configured for PostgreSQL or other databases in production)

Installation
Prerequisites

Python 3.8+
Node.js 16+
npm or yarn
Git

Steps

Clone the Repository
git clone https://github.com/Tijo-11/Vector-Ecom.git
cd retrorelics


Backend Setup (Django)

Create and activate a virtual environment:python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate


Install Python dependencies:pip install -r requirements.txt


Apply database migrations:python manage.py migrate


Create a superuser for the admin panel:python manage.py createsuperuser


Start the Django development server:python manage.py runserver




Frontend Setup (React with Vite)

Navigate to the frontend directory:cd frontend


Install JavaScript dependencies:npm install  # or yarn install


Start the Vite development server:npm run dev  # or yarn dev


Vite will provide a local server URL, typically http://localhost:5173.


Environment Variables

Create a .env file in the project root and configure the following:DEBUG=True
SECRET_KEY=your-django-secret-key
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
EMAIL_HOST=your-elastic-host
EMAIL_PORT=your-email-port
EMAIL_HOST_USER=your-email-user
EMAIL_HOST_PASSWORD=your-email-password




Access the Application

Frontend: http://localhost:5173 (or the URL provided by Vite)
Backend: http://localhost:8000
Admin Panel: http://localhost:8000/admin



Usage

Users: Browse retro, vintage, and antique products, add items to the cart, and complete purchases using PayPaliat or Razorpay. Track orders via the user dashboard and receive email confirmations for purchases.
Vendors: Register as a vendor, list products, manage inventory, and monitor sales through the vendor dashboard. Receive email notifications for sales.
Admins: Use the Jazzmin admin panel (/admin) to manage users, vendors, products, and orders.

Project Structure
retrorelics/
├── backend/                # Django backend
│   ├── manage.py
│   ├── retrorelics/        # Django project settings
│   ├── apps/               # Django apps (e.g., users, products, orders)
│   └── requirements.txt
├── frontend/               # React frontend (Vite)
│   ├── src/                # React components, Zustand stores, etc.
│   ├── public/
│   └── package.json
├── .env                    # Environment variables
└── README.md

Future Improvements

Add product search and filtering options.
Implement user reviews and ratings for products.
Enhance vendor analytics with sales reports.
Support additional payment gateways.
Optimize for production with a robust database like PostgreSQL.





Contributing

This project was built as part of a web development learning journey. Contributions, suggestions, and feedback are welcome! 
Please open an issue or submit a pull request on GitHub.

License
This project is licensed under the MIT License.
This project was built as part of a web development learning journey. Contributions, suggestions, and feedback are welcome! Please open an issue or submit a pull request on GitHub.
License
This project is licensed under the MIT License.
