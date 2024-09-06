# Video Sharing App Backend

This is a backend service for sharing YouTube videos with real-time notifications.

You can find the frontend part of this app at [here](https://github.com/minhhieple97/video-sharing-client.git).

## Live Demo

You can try out the live demo of this application at [here](https://video-sharing-green.vercel.app/).

## Prerequisites

- Docker
- Docker Compose

## Local Development Prerequisites (Optional)

- Node.js (v20.12.0 or higher)
- pnpm (v9.0.0 or higher)
- Prisma CLI (v5.11.0 or higher)

## Features

- User registration and login
- Sharing YouTube videos
- Viewing a list of shared videos
- Real-time notifications for new video shares

## Technologies Used

- Backend: NestJS (Node.js framework)
- Database: PostgreSQL
- Real-time notifications: WebSockets
- Containerization: Docker

## Setup and Running the App

1. Clone the repository:

   ```
   git clone https://github.com/minhhieple97/video-sharing-app.git
   cd video-sharing-app
   ```

2. **Obtain YouTube Data API credentials:**

   - Go to the [Google Developers Console](https://console.developers.google.com/).
   - Create a new project or select an existing one.
   - Enable the YouTube Data API v3.
   - Create credentials (API key) for the YouTube Data API.
   - Copy the generated API key and use it in your `.env.development` and `.env.test` files.

3. Create a `.env.development` file in the `root` directory following `.env.example` and add the following environment variables:

   ```
      REDIS_HOST=redis
      REDIS_PORT=6379
      DATABASE_URL="postgresql://postgres:postgres@postgres:5432/video_sharing"
      JWT_SECRET=secret
      YOUTUBE_API_KEY=YOUR_API_KEY_HERE
      DOMAIN=localhost
      CLIENT_URL=http://localhost:5173
      PORT=3000
   ```

4. Create a `.env.test` file in the `root` directory following `.env.example` and add the following environment variables:

   ```
      DATABASE_URL="postgresql://postgres:postgres@postgres_test:5432/video_sharing_test"
      REDIS_HOST=redis
      REDIS_PORT=6379
      JWT_SECRET=secret
      YOUTUBE_API_KEY=YOUR_API_KEY_HERE
      DOMAIN=localhost
      CLIENT_URL=http://localhost:5173
      PORT=3000
   ```

5. Build and start the Docker containers:

   ```
   docker-compose up --build -d
   ```

6. **Seed the database:**

   ```
   docker-compose run backend pnpm run seed
   ```

7. The application should now be running. Access it through your web browser:

   - Backend API: http://localhost:3000
   - Redis GUI: http://localhost:8082

8. Setup for local development (optional)

```
pnpm install
```

```
npx prisma generate
```

## Running Tests (Using Docker)

**To run the tests, use the following command:**

```
docker-compose run backend npm run test
```

## Usage

To use the YouTube Video Sharing App, follow these steps:

1. **User Registration and Login:**

   - Navigate to the registration page to create a new account.
   - After registration, log in using your credentials.

2. **Sharing YouTube Videos:**

   - Once logged in, you can share a YouTube video by entering the video URL in the designated input field.
   - Provide a title for the video and click the "Share" button to post it.

3. **Viewing Shared Videos:**

   - Access the main page to view a list of all shared videos.
   - Each entry will display the video title and the user who shared it.

4. **Real-time Notifications:**

   - When a user shares a new video, all logged-in users will receive a real-time notification.
   - Notifications will appear as a pop-up or banner, showing the video title and the name of the user who shared it.

5. **Additional Features:**
   - You can refresh the video list to see the latest shares.
   - Log out when finished to secure your account.

## Troubleshooting

If you encounter any issues, please try the following steps:

1. Ensure all required ports (3000,5433,5434,8082) are available on your machine.
2. If you've previously run the application, try removing all related containers and volumes:

```

docker-compose down -v

```

3. Rebuild the containers:

```

docker-compose up --build

```

If problems persist, please check the Docker logs for any error messages:

```

docker-compose logs

```

4. Please make sure that you create both `.env.development` and `.env.test` files in the root directory and they are correctly set up and that the environment variables are correctly configured. If you are using a different API key, please update the `.env.development` and `.env.test` files with the correct API key and re-run the Docker containers.
