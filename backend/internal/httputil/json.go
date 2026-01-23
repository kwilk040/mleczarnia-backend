package httputil

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"reflect"

	"github.com/go-playground/validator/v10"
	"github.com/shopspring/decimal"
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

func DecodeAndValidateBody[T any](writer http.ResponseWriter, body io.ReadCloser, data *T) error {
	defer body.Close()

	err := json.NewDecoder(body).Decode(data)
	if err != nil {
		logrus.WithError(err).Debug("failed to parse request body")
		return errors.New("invalid request body")
	}

	val := validator.New()
	if err := val.RegisterValidation(`decimalpos`, validateDecimalPositive); err != nil {
		return err
	}
	val.RegisterCustomTypeFunc(decimalValue, decimal.Decimal{})

	err = val.Struct(data)
	if err != nil {
		logrus.WithError(err).Debug()
		return err
	}
	return nil
}

func decimalValue(v reflect.Value) interface{} {
	n, ok := v.Interface().(decimal.Decimal)

	if !ok {
		return nil
	}

	return n.String()
}

func validateDecimalPositive(fl validator.FieldLevel) bool {
	value := fl.Field().Interface().(string)
	d, err := decimal.NewFromString(value)
	if err != nil {
		return false
	}

	return d.IsPositive()
}
