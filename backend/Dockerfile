FROM golang:1.24-alpine3.22

WORKDIR /app

# Air installieren
RUN go install github.com/air-verse/air@v1.62.0

COPY go.mod go.sum ./
RUN go mod download

COPY . .

EXPOSE 8080

CMD ["air"]