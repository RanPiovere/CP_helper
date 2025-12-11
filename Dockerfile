FROM sbtscala/scala-sbt:graalvm-ce-22.3.3-b1-java17_1.9.7_3.3.1 AS backend-builder

WORKDIR /app/backend

COPY backend/build.sbt backend/build.sbt
COPY backend/project backend/project

RUN sbt update

COPY backend/src backend/src

RUN sbt assembly

FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend .

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=backend-builder /app/backend/target/scala-3.3.1/careermatch.jar ./careermatch.jar

COPY --from=frontend-builder /app/frontend/dist ./public

ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

CMD ["java", "-jar", "careermatch.jar"]
