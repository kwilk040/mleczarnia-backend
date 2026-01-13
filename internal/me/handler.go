package me

import (
	"encoding/json"
	"mleczania/internal/auth"
	"mleczania/internal/httputil"
	"net/http"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type GetProfileResponse struct {
	Email             string     `json:"email"`
	Role              string     `json:"role"`
	LastLoginAt       *time.Time `json:"lastLoginAt"`
	CustomerCompanyId *int32     `json:"customerCompanyId"`
	EmployeeId        *int32     `json:"employeeId"`
}

func (handler *Handler) GetProfile(writer http.ResponseWriter, request *http.Request) {
	defer request.Body.Close()

	claims, ok := request.Context().Value(auth.UserCtxKey).(*auth.Claims)
	if !ok {
		httputil.WriteError(writer, http.StatusUnauthorized, "unauthorized")
		return
	}

	response, err := handler.service.GetProfile(request.Context(), int32(claims.UserID))
	if err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, err.Error())
	}

	httputil.WriteJSON(writer, http.StatusOK, response)
}

func (handler *Handler) ChangePassword(writer http.ResponseWriter, request *http.Request) {
	defer request.Body.Close()

	claims, ok := request.Context().Value(auth.UserCtxKey).(*auth.Claims)
	if !ok {
		httputil.WriteError(writer, http.StatusUnauthorized, "unauthorized")
		return
	}

	var body struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}

	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		logrus.WithError(err).Debug("failed to decode change password request")
		httputil.WriteError(writer, http.StatusBadRequest, "invalid request body")
		return
	}

	if body.CurrentPassword == "" {
		httputil.WriteError(writer, http.StatusBadRequest, "current_password is required")
		return
	}
	if body.NewPassword == "" {
		httputil.WriteError(writer, http.StatusBadRequest, "new_password is required")
		return
	}

	if err := handler.service.ChangePassword(request.Context(), int32(claims.UserID), body.CurrentPassword, body.NewPassword); err != nil {
		logrus.WithError(err).Debug("password change failed")

		errMsg := err.Error()
		if strings.Contains(errMsg, "incorrect") {
			httputil.WriteError(writer, http.StatusUnauthorized, "current password is incorrect")
		} else if strings.Contains(errMsg, "validation") || strings.Contains(errMsg, "must") {
			httputil.WriteError(writer, http.StatusBadRequest, errMsg)
		} else {
			httputil.WriteError(writer, http.StatusInternalServerError, "failed to change password")
		}
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, httputil.MessageResponse{
		Message: "Password changed successfully. Please login again on all devices.",
	})
}
