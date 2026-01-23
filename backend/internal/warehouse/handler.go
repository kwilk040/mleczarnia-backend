package warehouse

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/sirupsen/logrus"

	"mleczarnia/internal/httputil"
)

type Handler struct {
	service *Service
}

func NewHandler(s *Service) *Handler {
	return &Handler{service: s}
}

func (handler *Handler) ListStock(writer http.ResponseWriter, request *http.Request) {
	stock, err := handler.service.ListStock(request.Context())
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, ListStockResponse{Stocks: stock})
}

func (handler *Handler) GetStockByProductId(writer http.ResponseWriter, request *http.Request) {
	productId, err := handler.extractProductId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	stock, err := handler.service.GetStockByProductId(request.Context(), productId)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, stock)
}

func (handler *Handler) UpdateStock(writer http.ResponseWriter, request *http.Request) {
	productId, err := handler.extractProductId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	var body UpdateStockRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	if err := handler.service.UpdateStock(request.Context(), productId, body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) extractProductId(request *http.Request) (int32, error) {
	userIdStr := chi.URLParam(request, "productId")
	if userIdStr == "" {
		return 0, ErrProductIdRequired
	}

	userId, err := strconv.Atoi(userIdStr)
	if err != nil {
		return 0, ErrInvalidProductId
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
	case errors.Is(err, ErrProductIdRequired), errors.Is(err, ErrInvalidProductId):
		return http.StatusBadRequest, err.Error()
	case errors.Is(err, ErrStockNotFound):
		return http.StatusBadRequest, ErrStockNotFound.Error()

	default:
		return http.StatusInternalServerError, "internal server error"
	}
}
