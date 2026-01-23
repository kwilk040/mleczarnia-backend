package products

import (
	"context"
	"errors"
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

func (handler *Handler) ListProducts(writer http.ResponseWriter, request *http.Request) {
	products, err := handler.service.ListProducts(request.Context())
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, ListProductsResponse{Products: products})
}

func (handler *Handler) GetProduct(writer http.ResponseWriter, request *http.Request) {
	id, err := extractProductId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	product, err := handler.service.GetProduct(request.Context(), id)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, product)
}

func (handler *Handler) CreateProduct(writer http.ResponseWriter, request *http.Request) {
	var body CreateProductRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, err.Error())
		return
	}

	if err := handler.service.CreateProduct(request.Context(), body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) UpdateProduct(writer http.ResponseWriter, request *http.Request) {
	id, err := extractProductId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	var body UpdateProductRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		httputil.WriteError(writer, http.StatusBadRequest, err.Error())
		return
	}

	if err := handler.service.UpdateProduct(request.Context(), id, body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) ActivateProduct(writer http.ResponseWriter, request *http.Request) {
	handler.updateStatus(writer, request, handler.service.ActivateProduct)
}

func (handler *Handler) DeactivateProduct(writer http.ResponseWriter, request *http.Request) {
	handler.updateStatus(writer, request, handler.service.DeactivateProduct)
}

func (handler *Handler) updateStatus(
	writer http.ResponseWriter,
	request *http.Request,
	fn func(ctx context.Context, id int32) error,
) {
	id, err := extractProductId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	if err := fn(request.Context(), id); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func extractProductId(r *http.Request) (int32, error) {
	idStr := chi.URLParam(r, "productId")
	if idStr == "" {
		return 0, ErrProductIdRequired
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, ErrInvalidProductId
	}

	return int32(id), nil
}

func (handler *Handler) handleServiceError(writer http.ResponseWriter, err error) {
	statusCode, message := handler.mapErrorToResponse(err)
	logrus.WithError(err).Info()
	httputil.WriteError(writer, statusCode, message)
}

func (handler *Handler) mapErrorToResponse(err error) (int, string) {
	switch {
	case errors.Is(err, ErrProductIdRequired),
		errors.Is(err, ErrInvalidProductId),
		errors.Is(err, ErrFailedToParseDecimal):
		return http.StatusBadRequest, err.Error()
	case errors.Is(err, ErrProductNotFound):
		return http.StatusNotFound, err.Error()
	default:
		return http.StatusInternalServerError, "internal server error"
	}
}
