package auth

import (
	"encoding/json"
	"mleczania/internal/db/sqlc"
	"mleczania/internal/httputil"
	"net/http"

	"github.com/sirupsen/logrus"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type TokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

func (handler *Handler) RegisterCompany(writer http.ResponseWriter, request *http.Request) {
	defer request.Body.Close()

	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	err := json.NewDecoder(request.Body).Decode(&body)
	if err != nil {
		logrus.WithError(err).Debug("failed to parse request body")
		httputil.WriteError(writer, http.StatusBadRequest, "invalid request body")
		return
	}

	err = handler.service.Register(request.Context(), body.Email, body.Password, sqlc.RoleCLIENT)
	if err != nil {
		logrus.WithError(err).Error("failed to register user")
		httputil.WriteError(writer, http.StatusInternalServerError, "registration failed")
		return
	}

	writer.WriteHeader(http.StatusCreated)
}

func (handler *Handler) Login(writer http.ResponseWriter, request *http.Request) {
	defer request.Body.Close()

	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	err := json.NewDecoder(request.Body).Decode(&body)
	if err != nil {
		logrus.WithError(err).Debug("failed to parse body")
		httputil.WriteError(writer, http.StatusBadRequest, "invalid request body")
		return
	}

	accessToken, refreshToken, err := handler.service.Login(request.Context(), body.Email, body.Password)
	if err != nil {
		logrus.WithError(err).Error("failed to login")
		httputil.WriteError(writer, http.StatusInternalServerError, "invalid credentials")
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

func (handler *Handler) RefreshToken(writer http.ResponseWriter, request *http.Request) {
	defer request.Body.Close()

	var body struct {
		RefreshToken string `json:"refreshToken"`
	}

	err := json.NewDecoder(request.Body).Decode(&body)
	if err != nil {
		logrus.WithError(err).Debug("failed to decode refresh token request")
		httputil.WriteError(writer, http.StatusBadRequest, "invalid request body")
		return
	}

	if body.RefreshToken == "" {
		httputil.WriteError(writer, http.StatusBadRequest, "refresh token is required")
		return
	}

	accessToken, refreshToken, err := handler.service.RefreshToken(request.Context(), body.RefreshToken)
	if err != nil {
		logrus.WithError(err).Debug("failed to refresh token")
		httputil.WriteError(writer, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

func (handler *Handler) Logout(writer http.ResponseWriter, request *http.Request) {
	defer request.Body.Close()

	var body struct {
		RefreshToken string `json:"refreshToken"`
	}

	if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
		logrus.WithError(err).Debug("failed to decode logout request")
		httputil.WriteError(writer, http.StatusBadRequest, "invalid request body")
		return
	}

	if body.RefreshToken == "" {
		httputil.WriteError(writer, http.StatusBadRequest, "refresh token is required")
		return
	}

	if err := handler.service.Logout(request.Context(), body.RefreshToken); err != nil {
		logrus.WithError(err).Error("failed to logout")
		httputil.WriteError(writer, http.StatusInternalServerError, "logout failed")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}
