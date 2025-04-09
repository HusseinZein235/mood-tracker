# Mood Tracker Application

A web application for tracking mood and providing support through various features like mood logging, to-do lists, breathing exercises, Pomodoro timer, and AI chat support.

## Features

- User authentication (login/register)
- Mood tracking and analysis
- To-do list management
- Relaxation techniques
- Pomodoro timer
- Breathing exercises
- AI-powered chat support in Arabic

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   PORT=3000
   ```
4. Run the development server: `npm run dev`
5. Access the application at `http://localhost:3000`

## Deployment on Render

1. Create a MongoDB Atlas database:
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free tier cluster
   - Create a database user with password
   - Get your connection string

2. Deploy to Render:
   - Sign up at [Render.com](https://render.com)
   - Connect your GitHub repository
   - Create a new Web Service
   - Select your repository
   - Configure as:
     - Runtime: Node
     - Build Command: `npm install`
     - Start Command: `node app.js`
   - Add environment variables:
     - `MONGODB_URI`: your MongoDB Atlas connection string
     - `SESSION_SECRET`: a random string for session security
   - Deploy the application

## Technologies Used

- Node.js
- Express.js
- MongoDB
- HTML/CSS/JavaScript
- OpenRouter API for AI chat 