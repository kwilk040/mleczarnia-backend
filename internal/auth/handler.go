package auth

import (
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

type Address struct {
	Address    string           `json:"address" validate:"required,max=255"`
	City       string           `json:"city" validate:"required,max=100"`
	PostalCode string           `json:"postalCode" validate:"required,max=20"`
	Country    string           `json:"country" validate:"required,max=100"`
	Type       sqlc.AddressType `json:"type" validate:"required,oneof=SHIPPING BILLING"`
}

type RegisterCompanyRequest struct {
	Name        string    `json:"name" validate:"required,max=200"`
	TaxId       string    `json:"taxId" validate:"required,max=20"`
	MainEmail   string    `json:"mainEmail" validate:"required,email"`
	PhoneNumber *string   `json:"phoneNumber" validate:"e164"`
	Addresses   []Address `json:"addresses" validate:"required,min=1,dive"`
	Email       string    `json:"email" validate:"required,email"`
	Password    string    `json:"password" validate:"required"`
}

func (handler *Handler) RegisterCompany(writer http.ResponseWriter, request *http.Request) {
	var body RegisterCompanyRequest

	httputil.DecodeAndValidateBody(writer, request.Body, &body)

	err := handler.service.RegisterCompany(request.Context(), body)
	if err != nil {
		logrus.WithError(err).Error("failed to register user")
		httputil.WriteError(writer, http.StatusInternalServerError, "registration failed")
		return
	}

	writer.WriteHeader(http.StatusCreated)
}

func (handler *Handler) Login(writer http.ResponseWriter, request *http.Request) {
	var body struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required"`
	}

	httputil.DecodeAndValidateBody(writer, request.Body, &body)

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
	var body struct {
		RefreshToken string `json:"refreshToken" validate:"required"`
	}

	httputil.DecodeAndValidateBody(writer, request.Body, &body)

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
	var body struct {
		RefreshToken string `json:"refreshToken" validate:"required"`
	}

	httputil.DecodeAndValidateBody(writer, request.Body, &body)

	if err := handler.service.Logout(request.Context(), body.RefreshToken); err != nil {
		logrus.WithError(err).Error("failed to logout")
		httputil.WriteError(writer, http.StatusInternalServerError, "logout failed")
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}
