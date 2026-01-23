package invoices

import (
	"errors"
	"mleczarnia/internal/db/sqlc"
	"mleczarnia/internal/jwt"
	"net/http"
	"strconv"

	app "mleczarnia/internal/http"
	"mleczarnia/internal/httputil"

	"github.com/go-chi/chi/v5"
	"github.com/sirupsen/logrus"
)

type Handler struct {
	service *Service
}

func NewHandler(s *Service) *Handler {
	return &Handler{service: s}
}

func (handler *Handler) ListInvoices(writer http.ResponseWriter, request *http.Request) {
	claims := request.Context().Value(app.UserCtxKey).(*jwt.Claims)

	invoices, err := handler.service.ListInvoices(request.Context(), sqlc.Role(claims.Role), int32(claims.UserId))
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, ListInvoicesResponse{Invoices: *invoices})
}

func (handler *Handler) GetInvoiceById(writer http.ResponseWriter, request *http.Request) {
	invoiceId, err := handler.extractInvoiceId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}
	claims := request.Context().Value(app.UserCtxKey).(*jwt.Claims)

	invoice, err := handler.service.GetInvoiceById(request.Context(), invoiceId, sqlc.Role(claims.Role), int32(claims.UserId))
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	httputil.WriteJSON(writer, http.StatusOK, *invoice)
}

func (handler *Handler) GetInvoicePdf(writer http.ResponseWriter, request *http.Request) {
	invoiceId, err := handler.extractInvoiceId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}
	claims := request.Context().Value(app.UserCtxKey).(*jwt.Claims)

	invoice, err := handler.service.GetInvoiceById(request.Context(), invoiceId, sqlc.Role(claims.Role), int32(claims.UserId))
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	invoicePdfBytes, err := GenerateInvoicePDF(*invoice)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.Header().Set("Content-Type", "application/pdf")
	writer.Header().Set("Content-Disposition", "inline; filename="+invoice.InvoiceNumber+".pdf")
	writer.WriteHeader(http.StatusOK)
	writer.Write(invoicePdfBytes)
}

func (handler *Handler) CreateInvoiceForOrder(writer http.ResponseWriter, request *http.Request) {
	orderId, err := handler.extractOrderId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	if err := handler.service.CreateInvoiceForOrder(request.Context(), orderId); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusCreated)
}

func (handler *Handler) UpdateStatus(writer http.ResponseWriter, request *http.Request) {
	invoiceId, err := handler.extractInvoiceId(request)
	if err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	var body UpdateInvoiceStatusRequest
	if err := httputil.DecodeAndValidateBody(writer, request.Body, &body); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	if err := handler.service.UpdateInvoiceStatus(request.Context(), invoiceId, body.Status); err != nil {
		handler.handleServiceError(writer, err)
		return
	}

	writer.WriteHeader(http.StatusNoContent)
}

func (handler *Handler) extractInvoiceId(request *http.Request) (int32, error) {
	invoiceIdStr := chi.URLParam(request, "invoiceId")
	if invoiceIdStr == "" {
		return 0, ErrInvoiceIdRequired
	}

	invoiceId, err := strconv.Atoi(invoiceIdStr)
	if err != nil {
		return 0, ErrInvalidInvoiceId
	}

	return int32(invoiceId), nil
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
	case errors.Is(err, ErrInvalidStatusChange):
		return http.StatusConflict, err.Error()

	default:
		return http.StatusInternalServerError, "internal server error"
	}
}
