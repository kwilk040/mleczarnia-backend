package movements

import (
	"errors"
	"mleczarnia/internal/httputil"
	"mleczarnia/internal/warehouse"
	"net/http"

	"github.com/sirupsen/logrus"
)

type Handler struct {
	service *Service
}

func NewHandler(s *Service) *Handler {
	return &Handler{service: s}
}

func (handler *Handler) ListMovements(writer http.ResponseWriter, request *http.Request) {
	stockMovements, err := handler.service.ListMovements(request.Context())
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, ListStockMovementResponse{StockMovements: stockMovements})
}

func (handler *Handler) Inbound(writer http.ResponseWriter, request *http.Request) {
	var body InboundRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	movement, err := handler.service.Inbound(request.Context(), body, nil)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusCreated, movement)
}

func (handler *Handler) Dispatch(writer http.ResponseWriter, request *http.Request) {
	var body DispatchRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	movement, err := handler.service.Dispatch(request.Context(), body, nil)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusCreated, movement)
}

func (handler *Handler) Return(writer http.ResponseWriter, request *http.Request) {
	var body ReturnRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	movement, err := handler.service.Return(request.Context(), body, nil)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusCreated, movement)
}

func (handler *Handler) Loss(writer http.ResponseWriter, request *http.Request) {
	var body LossRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	movement, err := handler.service.Loss(request.Context(), body, nil)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusCreated, movement)
}
func (handler *Handler) handleServiceError(writer http.ResponseWriter, err error) {
	statusCode, message := handler.mapErrorToResponse(err)
	logrus.WithError(err).Info()
	httputil.WriteError(writer, statusCode, message)
}

func (handler *Handler) mapErrorToResponse(err error) (int, string) {
	switch {
	case errors.Is(err, warehouse.ErrStockNotFound), errors.Is(err, ErrMovementNotFound):
		return http.StatusNotFound, err.Error()
	case errors.Is(err, ErrInsufficientStock):
		return http.StatusConflict, err.Error()

	default:
		return http.StatusInternalServerError, "internal server error"
	}
}
