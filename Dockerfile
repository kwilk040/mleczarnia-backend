FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git make

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

RUN go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

COPY . .

RUN sqlc generate

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o mleczarnia .

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/mleczarnia .
COPY --from=builder /app/internal/assets/fonts ./internal/assets/fonts

EXPOSE 8080

CMD ["./mleczarnia"]
