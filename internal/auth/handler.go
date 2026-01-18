package auth

import (
	"errors"
	"mleczarnia/internal/crypto"
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

func (handler *Handler) RegisterCompany(writer http.ResponseWriter, request *http.Request) {
	var body RegisterCompanyRequest

	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, "invalid request")
		return
	}

	if err := handler.service.RegisterCompany(request.Context(), body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusCreated)
}

func (handler *Handler) Login(writer http.ResponseWriter, request *http.Request) {
	var body LoginRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, "invalid request")
		return
	}

	response, err := handler.service.Login(request.Context(), body.Email, body.Password)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, response)
}

func (handler *Handler) RefreshToken(writer http.ResponseWriter, request *http.Request) {
	var body RefreshTokenRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, "invalid request")
		return
	}

	response, err := handler.service.RefreshToken(request.Context(), body.RefreshToken)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, response)
}

func (handler *Handler) Logout(writer http.ResponseWriter, request *http.Request) {
	var body LogoutRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, "invalid request")
		return
	}

	if err := handler.service.Logout(request.Context(), body.RefreshToken); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) handleServiceError(writer http.ResponseWriter, err error) {
	statusCode, message := handler.mapErrorToResponse(err)
	logrus.WithError(err).Info()
	httputil.WriteError(writer, statusCode, message)
}

func (handler *Handler) mapErrorToResponse(err error) (int, string) {
	switch {
	case errors.Is(err, ErrInvalidCredentials):
		return http.StatusUnauthorized, ErrInvalidCredentials.Error()
	case errors.Is(err, jwt.ErrInvalidRefreshToken):
		return http.StatusUnauthorized, jwt.ErrInvalidRefreshToken.Error()
	case errors.Is(err, jwt.ErrExpiredToken):
		return http.StatusUnauthorized, jwt.ErrExpiredToken.Error()

	case errors.Is(err, ErrUserBlocked):
		return http.StatusForbidden, ErrUserBlocked.Error()

	case errors.Is(err, users.ErrUserNotFound):
		return http.StatusNotFound, users.ErrUserNotFound.Error()

	case errors.Is(err, crypto.ErrPasswordHash):
		return http.StatusBadRequest, crypto.ErrPasswordHash.Error()

	default:
		return http.StatusInternalServerError, "internal server error"
	}
}
