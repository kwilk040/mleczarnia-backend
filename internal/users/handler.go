package users

import (
	"errors"
	"mleczania/internal/httputil"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/sirupsen/logrus"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (handler *Handler) ListUsers(writer http.ResponseWriter, request *http.Request) {
	users, err := handler.service.ListUsers(request.Context())
	if err != nil {
		httputil.WriteError(writer, http.StatusInternalServerError, err.Error())
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, ListUsersResponse{
		Users: users,
	})
}

func (handler *Handler) CreateUser(writer http.ResponseWriter, request *http.Request) {
	var body CreateUserRequest

	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, err.Error())
		return
	}

	if err := handler.service.CreateUser(request.Context(), body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusCreated)
}

func (handler *Handler) GetUserDetails(writer http.ResponseWriter, request *http.Request) {
	userId, err := handler.extractUserId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	user, err := handler.service.GetUserDetails(request.Context(), userId)
	if err != nil {
		httputil.WriteError(writer, http.StatusInternalServerError, err.Error())
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, user)
}

func (handler *Handler) UpdateUser(writer http.ResponseWriter, request *http.Request) {
	userId, err := handler.extractUserId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	var body UpdateUserRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, err.Error())
		return
	}

	if err := body.ValidateBusinessLogic(); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, err.Error())
		return
	}

	if err := handler.service.UpdateUser(request.Context(), userId, body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) BlockUser(writer http.ResponseWriter, request *http.Request) {
	userId, err := handler.extractUserId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	if err := handler.service.BlockUser(request.Context(), userId); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) UnblockUser(writer http.ResponseWriter, request *http.Request) {
	userId, err := handler.extractUserId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	if err := handler.service.UnblockUser(request.Context(), userId); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) extractUserId(request *http.Request) (int32, error) {
	userIdStr := chi.URLParam(request, "userId")
	if userIdStr == "" {
		return 0, ErrUserIdRequired
	}

	userId, err := strconv.Atoi(userIdStr)
	if err != nil {
		return 0, ErrInvalidUserId
	}

	return int32(userId), nil
}

func (handler *Handler) handleServiceError(writer http.ResponseWriter, err error) {
	statusCode, message := handler.mapErrorToResponse(err)
	logrus.WithError(err).Info()
	httputil.WriteError(writer, statusCode, message)
}

func (handler *Handler) mapErrorToResponse(err error) (int, string) {
	switch {
	case errors.Is(err, ErrUserNotFound):
		return http.StatusNotFound, ErrUserNotFound.Error()

	case errors.Is(err, ErrEmployeeNotFound):
		return http.StatusBadRequest, ErrEmployeeNotFound.Error()
	case errors.Is(err, ErrCompanyNotFound):
		return http.StatusBadRequest, ErrCompanyNotFound.Error()
	case errors.Is(err, ErrInvalidAccountType):
		return http.StatusBadRequest, ErrInvalidAccountType.Error()
	case errors.Is(err, ErrInvalidUserId):
		return http.StatusBadRequest, ErrInvalidUserId.Error()
	case errors.Is(err, ErrUserIdRequired):
		return http.StatusBadRequest, ErrUserIdRequired.Error()

	default:
		return http.StatusInternalServerError, "internal server error"
	}
}
