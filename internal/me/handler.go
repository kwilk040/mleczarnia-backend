package me

import (
	"errors"
	"mleczarnia/internal/crypto"
	app "mleczarnia/internal/http"
	"mleczarnia/internal/httputil"
	"mleczarnia/internal/jwt"
	"mleczarnia/internal/users"
	"net/http"

	"github.com/sirupsen/logrus"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (handler *Handler) GetProfile(writer http.ResponseWriter, request *http.Request) {
	claims, ok := request.Context().Value(app.UserCtxKey).(*jwt.Claims)
	if !ok {
		httputil.WriteError(writer, http.StatusUnauthorized, "unauthorized")
		return
	}

	response, err := handler.service.GetProfile(request.Context(), int32(claims.UserId))
	if err != nil {
		handler.handleServiceError(writer, err)
	}

	httputil.WriteJSON(writer, http.StatusOK, response)
}

func (handler *Handler) ChangePassword(writer http.ResponseWriter, request *http.Request) {
	claims, ok := request.Context().Value(app.UserCtxKey).(*jwt.Claims)
	if !ok {
		httputil.WriteError(writer, http.StatusUnauthorized, "unauthorized")
		return
	}

	var changePasswordRequest ChangePasswordRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &changePasswordRequest); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, "bad request")
		return
	}

	if err := handler.service.ChangePassword(request.Context(), int32(claims.UserId), changePasswordRequest); err != nil {
		handler.handleServiceError(writer, err)
		return
	}
	httputil.WriteJSON(writer, http.StatusOK, ChangePasswordResponse{
		Message: "Password changed successfully. Please login again on all devices.",
	})
}

func (handler *Handler) handleServiceError(writer http.ResponseWriter, err error) {
	statusCode, message := handler.mapErrorToResponse(err)
	logrus.WithError(err).Info()
	httputil.WriteError(writer, statusCode, message)
}

func (handler *Handler) mapErrorToResponse(err error) (int, string) {
	switch {
	case errors.Is(err, crypto.ErrInvalidPassword):
		return http.StatusUnauthorized, crypto.ErrInvalidPassword.Error()

	case errors.Is(err, crypto.ErrSamePassword):
		return http.StatusBadRequest, crypto.ErrSamePassword.Error()

	case errors.Is(err, users.ErrUserNotFound):
		return http.StatusNotFound, users.ErrUserNotFound.Error()

	default:
		return http.StatusInternalServerError, "internal server error"
	}
}
