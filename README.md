# Eye-Know API

## Overview

Eye-Know API is the backend server for the **Eye-Know** full-stack application. It provides user authentication, profile management, and image-related functionality integrated with the Clarifai API. The API is built with **Express.js**, uses **PostgreSQL** for data storage, and **Redis** for session management and authentication tokens.

## Features

- **User Registration and Login** with secure password hashing (bcrypt) and JWT-based authentication
- **Profile Management** with endpoints to get and update user details
- **Image Processing** endpoints that interact with the Clarifai API for image recognition features
- **Entries Tracking** to keep count of user image submissions
- **Rate Limiting and Security** enhancements via `express-rate-limit` and `helmet`
- **Redis-backed Session Management** for stateless JWT authentication

## Technologies

- Node.js with Express.js
- PostgreSQL (hosted on Render)
- Redis (session store via Upstash)
- JWT for token-based authentication
- Clarifai API for image analysis
- Knex.js query builder
- Input validation with express-validator
- Security middleware with Helmet
- Rate limiting to prevent abuse

## Setup and Deployment

1. Set up PostgreSQL database (Render recommended)
2. Set up Redis database (Upstash recommended)
3. Configure environment variables:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `CLIENT_ORIGIN`
4. Run the server:
   - For production: `npm start`
   - For development (with auto reload): `npm run dev`
5. Connect your frontend to the API for user authentication and image recognition features

---

Feel free to contribute or reach out if you need help setting up or extending the API!
