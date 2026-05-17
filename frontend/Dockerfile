# Build Stage
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
# Build the Vite React app for production
RUN npm run build

# Production Stage - Nginx
FROM nginx:alpine

# Copy the built files from the builder stage to Nginx's web root
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Custom nginx configuration for React Router (Single Page App)
# We create this directly inline here for simplicity
RUN echo $'server {\n\
    listen 80;\n\
    location / {\n\
        root   /usr/share/nginx/html;\n\
        index  index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
