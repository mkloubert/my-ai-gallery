FROM node:22.17.0-alpine3.22

WORKDIR /app

COPY package*.json ./
RUN npm install --force

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]