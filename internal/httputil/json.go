package httputil

import (
	"encoding/json"
	"net/http"

	"github.com/sirupsen/logrus"
)

func WriteJSON(writer http.ResponseWriter, status int, data interface{}) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if err := json.NewEncoder(writer).Encode(data); err != nil {
		logrus.WithError(err).Error("failed to encode JSON response")
	}
}

func WriteError(writer http.ResponseWriter, status int, message string) {
	WriteJSON(writer, status, ErrorResponse{Error: message})
}
