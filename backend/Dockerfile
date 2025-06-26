FROM golang:1.24-alpine3.22

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

# Air installieren
RUN go install github.com/air-verse/air@v1.62.0

COPY go.mod go.sum ./
RUN go mod download

COPY . .

EXPOSE 8080

CMD ["air"]