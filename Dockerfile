FROM nginx:alpine

RUN apk add --update nodejs npm

WORKDIR /app
COPY package*.json ./

RUN \
    npm install && \
    npm install -g grunt-cli

COPY Gruntfile.js ./
COPY src/ ./src/

RUN grunt build

RUN \
    rm -rf /usr/share/nginx/html/* && \
    cp -r dist/* /usr/share/nginx/html

EXPOSE 80

