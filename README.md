# 🛒 LocalCart - Hyperlocal Marketplace

![LocalCart Banner](../LOCALCART-WEB/FRONTEND/src/assets/banner.png)

LocalCart is a modern hyperlocal marketplace web application built with the MERN stack (MongoDB, Express, React, Node.js). It connects local vendors with nearby customers, enabling intuitive product discovery, purchasing, and management with real-time location-based features.

---

## 🌐 Live Demo

- [localcart.netlify.app](https://localcart.netlify.app)

---

## ✨ Features Overview

### 👤 Customer Experience
- **Location-Based Browsing:** Auto-detect or manually select your city to view local products.
- **Easy Ordering:** Simple cart management and order placement.
- **Order Tracking:** Real-time updates from order placement to delivery.
- **Direct Communication:** Contact vendors or support directly.

### 🛍️ Vendor Capabilities
- **Product Management:** List and manage inventory with automatic location tagging.
- **Analytics Dashboard:** Track revenue, orders, and product performance.
- **Order Notifications:** Receive instant email alerts for new orders.
- **Inventory Control:** Update product details and stock in real-time.

### 🛠️ Admin Control Panel
- **Vendor Management:** Review and approve vendor registrations.
- **User & Content Management:** Manage users, vendors, and listings.
- **Platform Analytics:** Access marketplace performance insights.
- **Content Moderation:** Maintain a safe environment.

---

## 🛠️ Tech Stack

| Category      | Technology                                | Description                                         |
|---------------|-------------------------------------------|-----------------------------------------------------|
| Frontend      | React.js + Vite                           | Component-based interactive UI                      |
| Styling       | Tailwind CSS                              | Utility-first CSS framework                         |
| Backend       | Node.js + Express                         | API and server logic                                |
| Database      | MongoDB + Mongoose                        | NoSQL storage with schema validation                |
| APIs/Services | Geolocation API, Nodemailer, Chart.js     | Location, email, and data visualization             |
| Deployment    | Netlify (Frontend), Render (Backend)      | Hosting and CI/CD                                   |

---

## 🗂️ Project Structure

```plaintext
LocalCart/
├── backend/
│   ├── controllers/    # API request handling
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   ├── utils/          # Utility functions
│   └── server.js       # Backend entry point
├── frontend/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application views
│   ├── context/        # Global state management
│   ├── App.jsx         # Root component
│   └── main.jsx        # Frontend entry point
├── .env                # Environment variables
└── README.md           # Project documentation
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/localcart.git
cd localcart
```

### 2. Configure Environment Variables

Create `.env` files in both `/backend` and `/frontend` with the required credentials.

**backend/.env**
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Run Locally

```bash
# Backend
cd backend
npm run dev

# Frontend
cd ../frontend
npm run dev
```

Access the app at: [http://localhost:5173](http://localhost:5173)

---

## 🚀 Deployment

- **Frontend:** Hosted on Netlify ([localcart.netlify.app](https://localcart.netlify.app))
- **Backend:** Hosted on Render (private URL)

---

## 🔮 Future Enhancements

- Payment gateway integration
- Progressive Web App (PWA) support
- Multilingual UI
- Real-time push notifications
- Vendor subscription tiers
- User reviews and ratings system

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

## 📬 Contact

- **Developer:** Vivek Singh
- **Email:** viveks3931@gmail.com
- **Portfolio:** [viveks-profile.netlify.app](https://viveks-profile.netlify.app)
- **GitHub:** [github.com/vivek3931](https://github.com/vivek3931)