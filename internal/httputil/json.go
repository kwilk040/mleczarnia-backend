package httputil

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/go-playground/validator/v10"
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

func DecodeAndValidateBody[T any](writer http.ResponseWriter, body io.ReadCloser, data *T) {
	defer body.Close()

	err := json.NewDecoder(body).Decode(data)
	if err != nil {
		logrus.WithError(err).Debug("failed to parse request body")
		WriteError(writer, http.StatusBadRequest, "invalid request body")
		return
	}

	err = validator.New().Struct(data)
	if err != nil {
		logrus.WithError(err).Debug()
		WriteError(writer, http.StatusBadRequest, err.Error())
		return
	}
}
