# 🛒 LocalCart - Hyperlocal Marketplace

**LocalCart** is a modern hyperlocal marketplace web application built using the **MERN stack** (MongoDB, Express, React, Node.js). It empowers local vendors to connect with customers in their vicinity, offering a seamless platform to discover and purchase products with real-time location-based features.

🌐 **Live Demo**: [localcart.netlify.app](http://localcart.netlify.app)

---

## ✨ Key Features

### Customer Experience

-   **Location-Based Browsing:** Discover products available in your city, with options for auto-location detection or manual selection.
-   **Effortless Ordering:** Easily add items to your cart and place orders.
-   **Order Tracking:** Stay updated with order history and real-time delivery status.
-   **Direct Communication:** Contact vendors and support through integrated communication tools.

### Vendor Capabilities

-   **Product Management:** List and manage products with automatic location tagging.
-   **Analytics Dashboard:** Track key metrics such as revenue, orders, and product performance.
-   **Real-time Notifications:** Receive instant email notifications for new orders.
-   **Inventory Control:** Update product details and stock levels in real-time.

### Admin Control Panel

-   **Vendor Management:** Review and approve vendor registrations.
-   **User & Content Management:** Manage users, vendors, and listings efficiently.
-   **Platform Analytics:** Access platform-wide analytics and monitoring tools.
-   **Content Moderation:** Block/report inappropriate content or vendors.

---

## 🛠️ Tech Stack

| Category         | Technology             | Description                               |
| :--------------- | :--------------------- | :---------------------------------------- |
| **Frontend**     | React.js, Vite         | Modern JavaScript library for user interfaces |
|                  | Tailwind CSS           | Utility-first CSS framework               |
| **Backend**      | Node.js, Express.js    | JavaScript runtime and web application framework |
| **Database**     | MongoDB                | NoSQL database                             |
| **APIs/Services** | Geolocation API        | Location-based services                   |
|                  | Nodemailer             | Email sending service                     |
| **Charting**     | Chart.js               | JavaScript charting library               |
| **Deployment**   | Netlify                | Frontend deployment platform              |
|                  | Render                 | Backend deployment platform               |

---

## 🗂️ Project Structure

```
LocalCart/
├── backend/
│   ├── controllers/    # Handles request logic
│   ├── models/         # Data models
│   ├── routes/         # API endpoints
│   ├── utils/          # Utility functions
│   └── server.js       # Main backend server file
├── frontend/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application pages
│   ├── context/        # State management
│   ├── App.jsx         # Main application component
│   └── main.jsx        # Entry point for frontend
├── .env                # Environment variables
├── package.json        # Project dependencies and scripts
└── README.md           # Project documentation
```

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/localcart.git
cd localcart
```

### 2. Configure Environment Variables

Create `.env` files in both the `/backend` and `/frontend` directories.

**Backend (.env):**

```ini
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

**Frontend (.env):**

```ini
VITE_API_URL=https://your-backend-url.onrender.com/api
```

*Remember to replace placeholder values with your actual credentials and backend URL.*

### 3. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 4. Run Locally

```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev
```

Access the app at: `http://localhost:5173`

---

## 🚀 Deployment

-   **Frontend:** [https://localcart.netlify.app](https://localcart.netlify.app)
-   **Backend:** Hosted on Render (private URL)

---

## 🔮 Future Enhancements

-   💳 Integrate payment gateways (Razorpay/Stripe).
-   📱 Build PWA support for enhanced mobile experience.
-   🌍 Implement multilingual UI.
-   🔔 Add real-time push notifications.
-   📌 Introduce vendor subscription tiers.

---

## 🤝 Contributing

1.  Fork the project.
2.  Create a new branch: `git checkout -b feature-name`.
3.  Commit your changes: `git commit -am 'Add feature'`.
4.  Push to the branch: `git push origin feature-name`.
5.  Create a pull request.

---

## 📜 License

This project is licensed under the MIT License.

---

## 📬 Contact

**Developer:** Vivek Singh

-   **Email:** viveks3931@gmail.com
-   **Portfolio:** [http://viveks-profile.netlify.app](http://viveks-profile.netlify.app)
-   **GitHub:** [github.com/vivek3931](https://github.com/vivek3931)