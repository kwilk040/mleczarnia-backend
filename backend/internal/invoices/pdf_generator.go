package invoices

import (
	"bytes"
	"fmt"

	"github.com/jung-kurt/gofpdf"
)

func GenerateInvoicePDF(data InvoiceDetails) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 20, 15)
	pdf.AddPage()

	pdf.AddUTF8Font("JuliaMono", "", "internal/assets/fonts/JuliaMono-Regular.ttf")
	pdf.AddUTF8Font("JuliaMono", "B", "internal/assets/fonts/JuliaMono-Bold.ttf")

	addHeader(pdf, data)
	addCompanySection(pdf, data)
	addItemsTable(pdf, data.Items)
	addTotals(pdf, data)

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func addHeader(pdf *gofpdf.Fpdf, data InvoiceDetails) {
	pdf.SetFont("JuliaMono", "B", 20)
	pdf.Cell(0, 10, "Faktura nr: "+data.InvoiceNumber)
	pdf.Ln(12)

	pdf.SetFont("JuliaMono", "", 10)
	pdf.Cell(100, 6, fmt.Sprintf("Zamówienie: %s", data.OrderNumber))
	pdf.Ln(5)

	pdf.Cell(100, 6, fmt.Sprintf("Data wystawienia: %s", data.IssueDate.Format("2006-01-02")))
	pdf.Cell(0, 6, fmt.Sprintf("Termin zapłaty: %s", data.DueDate.Format("2006-01-02")))
	pdf.Ln(10)
}

func addCompanySection(pdf *gofpdf.Fpdf, data InvoiceDetails) {
	pdf.SetFont("JuliaMono", "B", 11)
	pdf.Cell(0, 6, "Nabywca:")
	pdf.Ln(6)

	pdf.SetFont("JuliaMono", "", 10)
	pdf.Cell(0, 5, data.CompanyName)
	pdf.Ln(5)
	pdf.Cell(0, 5, fmt.Sprintf("NIP: %s", data.TaxId))
	pdf.Ln(5)
	pdf.Cell(0, 5, data.Email)
	pdf.Ln(10)
}

func addItemsTable(pdf *gofpdf.Fpdf, items []InvoiceItem) {
	pdf.SetFont("JuliaMono", "B", 10)

	headers := []string{"Nazwa towaru", "Jednostka", "Ilość", "Cena jedn.", "Wartość"}
	widths := []float64{70, 20, 15, 35, 30}

	for i, h := range headers {
		pdf.CellFormat(widths[i], 7, h, "1", 0, "C", false, 0, "")
	}
	pdf.Ln(-1)

	pdf.SetFont("JuliaMono", "", 10)

	for _, it := range items {
		pdf.CellFormat(widths[0], 6, it.ProductName, "1", 0, "", false, 0, "")
		pdf.CellFormat(widths[1], 6, it.Unit, "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[2], 6, fmt.Sprintf("%d", it.Quantity), "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[3], 6, it.UnitPrice, "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[4], 6, it.LineTotal, "1", 0, "R", false, 0, "")
		pdf.Ln(-1)
	}

	pdf.Ln(8)
}

func addTotals(pdf *gofpdf.Fpdf, data InvoiceDetails) {
	pdf.SetFont("JuliaMono", "B", 11)
	pdf.Cell(140, 8, "Razem:")
	pdf.CellFormat(40, 8, data.TotalAmount, "1", 0, "R", false, 0, "")
	pdf.Ln(12)
}
