package companies

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

func (handler *Handler) ListCompanies(writer http.ResponseWriter, request *http.Request) {
	companies, err := handler.service.ListCompanies(request.Context())
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, ListCompaniesResponse{Companies: companies})
}

func (handler *Handler) GetCompanyDetails(writer http.ResponseWriter, request *http.Request) {
	companyId, err := handler.extractCompanyId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	response, err := handler.service.GetCompany(request.Context(), companyId)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, response)
}

func (handler *Handler) UpdateCompany(writer http.ResponseWriter, request *http.Request) {
	companyId, err := handler.extractCompanyId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}
	var body UpdateCompanyRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, err.Error())
		return
	}

	if err := handler.service.UpdateCompany(request.Context(), companyId, body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) ActivateCompany(writer http.ResponseWriter, request *http.Request) {
	companyId, err := handler.extractCompanyId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	if err := handler.service.ActivateCompany(request.Context(), companyId); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) DeactivateCompany(writer http.ResponseWriter, request *http.Request) {
	companyId, err := handler.extractCompanyId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	if err := handler.service.DeactivateCompany(request.Context(), companyId); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) extractCompanyId(request *http.Request) (int32, error) {
	companyIdStr := chi.URLParam(request, "companyId")
	if companyIdStr == "" {
		return 0, ErrCompanyIdRequired
	}

	companyId, err := strconv.Atoi(companyIdStr)
	if err != nil {
		return 0, ErrInvalidCompanyId
	}

	return int32(companyId), nil
}

func (handler *Handler) handleServiceError(writer http.ResponseWriter, err error) {
	statusCode, message := handler.mapErrorToResponse(err)
	logrus.WithError(err).Info()
	httputil.WriteError(writer, statusCode, message)
}

func (handler *Handler) mapErrorToResponse(err error) (int, string) {
	switch {
	case errors.Is(err, ErrCompanyIdRequired):
		return http.StatusBadRequest, ErrCompanyIdRequired.Error()
	case errors.Is(err, ErrInvalidCompanyId):
		return http.StatusBadRequest, ErrInvalidCompanyId.Error()

	case errors.Is(err, ErrCompanyNotFound):
		return http.StatusNotFound, ErrCompanyNotFound.Error()

	default:
		return http.StatusInternalServerError, "internal server error"
	}
}
