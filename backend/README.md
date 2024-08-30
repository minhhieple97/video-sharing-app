# YouTube Video Sharing App

This is a web application for sharing YouTube videos with real-time notifications.

## Features

- User registration and login
- Sharing YouTube videos
- Viewing a list of shared videos
- Real-time notifications for new video shares

## Technologies Used

- Backend: NestJS (Node.js framework)
- Frontend: React
- Database: PostgreSQL
- Caching: Redis
- Real-time notifications: WebSockets
- Containerization: Docker

## Prerequisites

- Docker
- Docker Compose

## Setup and Running the App

1. Clone the repository:

   ```
   git clone https://github.com/minhhieple97/video-sharing-app.git
   cd youtube-video-sharing-app
   ```

2. Create a `.env` file in the `backend` directory follow `.env.example` and add the following environment variables:

   ```
   REDIS_HOST=redis
   REDIS_PORT=6379
   DATABASE_URL="postgresql://postgres:postgres@postgres:5432/video_sharing"
   JWT_SECRET=secret
   ```

3. Build and start the Docker containers:

   ```
   docker-compose up --build
   ```

4. The application should now be running. Access it through your web browser:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5173
   - Redis GUI: http://localhost:8082

## Running Tests

To run the tests, use the following command:

```
## Stopping the Application

To stop the application and remove the containers, use:

## Troubleshooting

If you encounter any issues, please try the following steps:

1. Ensure all required ports (3000,5173, 5433, 8082) are available on your machine.
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

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
```
