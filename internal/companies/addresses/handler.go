package addresses

import (
	"errors"
	"mleczania/internal/companies"
	"mleczania/internal/httputil"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/sirupsen/logrus"
)

type Handler struct {
	service *Service
}

func NewHandler(s *Service) *Handler {
	return &Handler{service: s}
}

func (handler *Handler) ListAddresses(writer http.ResponseWriter, request *http.Request) {
	companyId, err := handler.extractCompanyId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	addresses, err := handler.service.ListAddresses(request.Context(), companyId)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, addresses)
}

func (handler *Handler) CreateAddress(writer http.ResponseWriter, request *http.Request) {
	companyId, err := handler.extractCompanyId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	var req CreateAddressRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &req); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, err.Error())
		return
	}

	if err := handler.service.CreateAddress(request.Context(), companyId, req); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) UpdateAddress(writer http.ResponseWriter, request *http.Request) {
	companyId, err := handler.extractCompanyId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}
	addressId, err := handler.extractAddressId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	var req UpdateAddressRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &req); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, err.Error())
		return
	}

	if err := handler.service.UpdateAddress(request.Context(), companyId, addressId, req); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) extractCompanyId(request *http.Request) (int32, error) {
	companyIdStr := chi.URLParam(request, "companyId")
	if companyIdStr == "" {
		return 0, companies.ErrCompanyIdRequired
	}

	companyId, err := strconv.Atoi(companyIdStr)
	if err != nil {
		return 0, companies.ErrInvalidCompanyId
	}

	return int32(companyId), nil
}

func (handler *Handler) extractAddressId(request *http.Request) (int32, error) {
	addressIdStr := chi.URLParam(request, "addressId")
	if addressIdStr == "" {
		return 0, ErrAddressIdRequired
	}

	addressId, err := strconv.Atoi(addressIdStr)
	if err != nil {
		return 0, ErrInvalidAddressId
	}

	return int32(addressId), nil
}

func (handler *Handler) handleServiceError(writer http.ResponseWriter, err error) {
	statusCode, message := handler.mapErrorToResponse(err)
	logrus.WithError(err).Info()
	httputil.WriteError(writer, statusCode, message)
}

func (handler *Handler) mapErrorToResponse(err error) (int, string) {
	switch {
	case errors.Is(err, ErrAddressIdRequired):
		return http.StatusBadRequest, ErrAddressIdRequired.Error()
	case errors.Is(err, ErrInvalidAddressId):
		return http.StatusBadRequest, ErrInvalidAddressId.Error()

	case errors.Is(err, ErrAddressNotFound):
		return http.StatusNotFound, ErrAddressNotFound.Error()

	default:
		return http.StatusInternalServerError, "internal server error"
	}
}
