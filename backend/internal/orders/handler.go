package orders

import (
	"errors"
	"mleczarnia/internal/db/sqlc"
	app "mleczarnia/internal/http"
	"mleczarnia/internal/httputil"
	"mleczarnia/internal/jwt"
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

func (handler *Handler) CreateOrder(writer http.ResponseWriter, request *http.Request) {
	claims := request.Context().Value(app.UserCtxKey).(*jwt.Claims)

	var req CreateOrderRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &req); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	order, err := handler.service.CreateOrder(request.Context(), int32(claims.UserId), req)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusCreated, order)
}

func (handler *Handler) ListOrders(writer http.ResponseWriter, request *http.Request) {
	claims := request.Context().Value(app.UserCtxKey).(*jwt.Claims)

	orders, err := handler.service.ListOrders(request.Context(), int32(claims.UserId), sqlc.Role(claims.Role))
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, ListOrdersResponse{Orders: *orders})
}

func (handler *Handler) GetOrder(writer http.ResponseWriter, request *http.Request) {
	claims := request.Context().Value(app.UserCtxKey).(*jwt.Claims)

	orderId, err := handler.extractOrderId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	order, err := handler.service.GetOrder(request.Context(), orderId, sqlc.Role(claims.Role), int32(claims.UserId))
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, order)
}

func (handler *Handler) GetOrderItems(writer http.ResponseWriter, request *http.Request) {
	claims := request.Context().Value(app.UserCtxKey).(*jwt.Claims)

	orderId, err := handler.extractOrderId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	items, err := handler.service.GetOrderItems(request.Context(), orderId, sqlc.Role(claims.Role), int32(claims.UserId))
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, GetOrderItemsResponse{Items: *items})
}

func (handler *Handler) UpdateStatus(writer http.ResponseWriter, request *http.Request) {
	orderId, err := handler.extractOrderId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	var req UpdateOrderStatusRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &req); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	if err := handler.service.UpdateOrderStatus(request.Context(), orderId, req.Status); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) extractOrderId(request *http.Request) (int32, error) {
	orderIdStr := chi.URLParam(request, "orderId")
	if orderIdStr == "" {
		return 0, ErrOrderIdRequired
	}

	orderId, err := strconv.Atoi(orderIdStr)
	if err != nil {
		return 0, ErrInvalidOrderId
	}

	return int32(orderId), nil
}

func (handler *Handler) handleServiceError(writer http.ResponseWriter, err error) {
	statusCode, message := handler.mapErrorToResponse(err)
	logrus.WithError(err).Info()
	httputil.WriteError(writer, statusCode, message)
}

// TODO: error handling
func (handler *Handler) mapErrorToResponse(err error) (int, string) {
	switch {
	case errors.Is(err, ErrInvalidStatusTransition):
		return http.StatusConflict, err.Error()

	default:
		return http.StatusInternalServerError, "internal server error"
	}
}
