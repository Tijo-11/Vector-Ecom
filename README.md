

```markdown
# 🛍️ RetroRelics

**RetroRelics** is a multivendor e-commerce platform designed for buying and selling retro, vintage, and antique products. Built as a web development learning project, it leverages modern technologies to provide a seamless experience for users and vendors, with features like secure payments, dashboards, and email notifications.

---

## ✨ Features

- **Multivendor Model**: Multiple vendors can list and sell retro, vintage, and antique products.
- **User Dashboard**: Browse products, manage cart, and track orders.
- **Vendor Dashboard**: Manage listings, view sales, and track orders.
- **Payment Integration**: Secure payments via PayPal and Razorpay.
- **Email Notifications**: Automated emails for successful transactions.
- **Admin Interface**: Customizable admin panel using Jazzmin.
- **Responsive Design**: Tailwind CSS for modern UI.
- **State Management**: Zustand for efficient React state handling.

---

## 🧰 Tech Stack

| Layer         | Technology                     |
|--------------|---------------------------------|
| Backend       | Django (Python)                |
| Frontend      | React (with Vite)              |
| State Mgmt    | Zustand                        |
| Styling       | Tailwind CSS                   |
| Payments      | PayPal, Razorpay               |
| Admin Panel   | Jazzmin (Django theme)         |
| Database      | SQLite (dev) / PostgreSQL (prod) |

---
📚 API Documentation
This project uses drf-yasg to generate interactive Swagger documentation for all REST APIs.

Once the Django server is running, you can access the API docs at:

Swagger UI: http://localhost:8000/swagger/

ReDoc: http://localhost:8000/redoc/

These interfaces allow you to explore available endpoints, view request/response formats, and test APIs directly from the browser.

## ⚙️ Installation

### 🔑 Prerequisites

- Python 3.8+
- Node.js 16+
- npm or Yarn
- Git

### 📦 Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/Tijo-11/retrorelics.git
cd retrorelics
```

---

### 🐍 Backend Setup (Django)

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

---

### ⚛️ Frontend Setup (React + Vite)

```bash
cd frontend

# Install dependencies
npm install  # or yarn install

# Start Vite dev server
npm run dev  # or yarn dev
```

> Vite will typically serve at [http://localhost:5173](http://localhost:5173)

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following content:

```env
DEBUG=True
SECRET_KEY=your-django-secret-key

PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret

RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

EMAIL_HOST=your-email-host
EMAIL_PORT=your-email-port
EMAIL_HOST_USER=your-email-user
EMAIL_HOST_PASSWORD=your-email-password
```

---

## 🚀 Access the Application

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend**: [http://localhost:8000](http://localhost:8000)
- **Admin Panel**: [http://localhost:8000/admin](http://localhost:8000/admin)

---

## 👥 Usage

- **Users**: Browse, add to cart, purchase via PayPal/Razorpay, track orders, receive email confirmations.
- **Vendors**: Register, list products, manage inventory, monitor sales, receive email notifications.
- **Admins**: Manage users, vendors, products, and orders via Jazzmin admin panel.

---

## 📁 Project Structure

```
retrorelics/
├── backend/                # Django backend
│   ├── manage.py
│   ├── retrorelics/        # Django project settings
│   ├── apps/               # Django apps (users, products, orders)
│   └── requirements.txt
├── frontend/               # React frontend (Vite)
│   ├── src/                # React components, Zustand stores
│   ├── public/
│   └── package.json
├── .env                    # Environment variables
└── README.md
```

---

## 🔮 Future Improvements

- Product search and filtering
- User reviews and ratings
- Vendor analytics and sales reports
- Additional payment gateways
- PostgreSQL optimization for production

---

## 🤝 Contributing

This project is part of a web development learning journey. Contributions, suggestions, and feedback are welcome!

Feel free to:
- Open an issue
- Submit a pull request

---

## 📄 License

This project is licensed under the **MIT License**.
```

