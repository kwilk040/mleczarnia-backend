package employees

import (
	"mleczarnia/internal/httputil"
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

func (handler *Handler) ListEmployees(writer http.ResponseWriter, request *http.Request) {
	employees, err := handler.service.ListEmployees(request.Context())
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, ListEmployeesResponse{Employees: employees})
}

func (handler *Handler) GetEmployee(writer http.ResponseWriter, request *http.Request) {
	employeeId, err := handler.extractEmployeeId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	emp, err := handler.service.GetEmployee(request.Context(), employeeId)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, emp)
}

func (handler *Handler) CreateEmployee(writer http.ResponseWriter, request *http.Request) {
	var body CreateEmployeeRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	emp, err := handler.service.CreateEmployee(request.Context(), body)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusCreated, emp)
}

func (handler *Handler) UpdateEmployee(writer http.ResponseWriter, request *http.Request) {
	employeeId, err := handler.extractEmployeeId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	var body UpdateEmployeeRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	if err := handler.service.UpdateEmployee(request.Context(), employeeId, body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) extractEmployeeId(request *http.Request) (int32, error) {
	employeeIdStr := chi.URLParam(request, "employeeId")
	if employeeIdStr == "" {
		return 0, ErrEmployeeIdRequired
	}

	employeeId, err := strconv.Atoi(employeeIdStr)
	if err != nil {
		return 0, ErrInvalidEmployeeId
	}

	return int32(employeeId), nil
}

func (handler *Handler) handleServiceError(writer http.ResponseWriter, err error) {
	statusCode, message := handler.mapErrorToResponse(err)
	logrus.WithError(err).Info()
	httputil.WriteError(writer, statusCode, message)
}

// TODO: error handling
func (handler *Handler) mapErrorToResponse(err error) (int, string) {
	switch {

	default:
		return http.StatusInternalServerError, "internal server error"
	}
}
