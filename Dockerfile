FROM nginx:alpine

RUN apk add --update --no-cache nodejs npm

WORKDIR /app
COPY package*.json ./

RUN \
    npm install && \
    npm install -g grunt-cli

RUN rm -rf /usr/share/nginx/html/*

COPY Gruntfile.js ./
COPY src/ ./src/

# the grunt is responsible for deploying the build to nginx
# web root, avoiding copy layer, see Gruntfile.js
RUN grunt build

EXPOSE 80

