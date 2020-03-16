FROM nginx:latest

WORKDIR /usr/share/nginx

COPY ./dist ./html
