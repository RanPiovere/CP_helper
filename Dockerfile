# -----------------------
# Backend builder stage
# -----------------------
FROM sbtscala/scala-sbt:graalvm-ce-22.3.3-b1-java17_1.9.7_3.3.1 AS backend-builder

WORKDIR /app/backend

# Копируем всё сразу, чтобы sbt видел build.sbt, plugins.sbt, project/ и src
COPY backend/ .

# Обновляем зависимости
RUN sbt update

# Собираем fat-jar с sbt-assembly
RUN sbt assembly

# -----------------------
# Frontend builder stage
# -----------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Копируем package.json и package-lock.json и ставим зависимости
COPY frontend/package*.json ./
RUN npm ci

# Копируем весь фронтенд
COPY frontend/ .

# Аргумент для API
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Собираем фронтенд
RUN npm run build

# -----------------------
# Final runtime stage
# -----------------------
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Копируем backend jar
COPY --from=backend-builder /app/backend/target/scala-3.3.1/careermatch.jar ./careermatch.jar

# Копируем фронтенд сборку
COPY --from=frontend-builder /app/frontend/dist ./public

# Порт и хост
ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

# Запуск приложения
CMD ["java", "-jar", "careermatch.jar"]
