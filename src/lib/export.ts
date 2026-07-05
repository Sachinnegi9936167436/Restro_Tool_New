/**
 * Export utilities: CSV, Excel (XLSX), PDF
 */
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportRow {
  name: string
  category: string
  city: string
  address: string
  phone?: string
  email?: string
  website?: string
  rating?: number
  reviews?: number
  hasWebsite: boolean
  leadStatus: string
  notes?: string
  createdAt: string
}

const HEADERS = [
  'Name',
  'Category',
  'City',
  'Address',
  'Phone',
  'Email',
  'Website',
  'Rating',
  'Reviews',
  'Has Website',
  'Lead Status',
  'Notes',
  'Created At',
]

function rowToArray(row: ExportRow): (string | number | boolean)[] {
  return [
    row.name,
    row.category,
    row.city,
    row.address,
    row.phone || '',
    row.email || '',
    row.website || '',
    row.rating ?? '',
    row.reviews ?? '',
    row.hasWebsite ? 'Yes' : 'No',
    row.leadStatus,
    row.notes || '',
    row.createdAt,
  ]
}

/** Generate CSV buffer */
export function generateCsv(rows: ExportRow[]): Uint8Array {
  const lines = [
    HEADERS.join(','),
    ...rows.map((row) =>
      rowToArray(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ]
  return new TextEncoder().encode(lines.join('\n'))
}

/** Generate Excel (XLSX) buffer */
export function generateExcel(rows: ExportRow[]): Uint8Array {
  const data = [HEADERS, ...rows.map(rowToArray)]
  const ws = XLSX.utils.aoa_to_sheet(data)

  // Style header row
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })]
    if (cell) {
      cell.s = { font: { bold: true }, fill: { fgColor: { rgb: '4F46E5' } } }
    }
  }

  ws['!cols'] = HEADERS.map(() => ({ wch: 20 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Restaurants')
  const xlsxBuffer: Uint8Array = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Uint8Array
  return xlsxBuffer
}

/** Generate PDF buffer */
export function generatePdf(rows: ExportRow[]): Uint8Array {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Restaurant Lead Finder — Export', 14, 15)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}  |  Total: ${rows.length} records`, 14, 22)

  autoTable(doc, {
    head: [HEADERS],
    body: rows.map(rowToArray).map((r) => r.map(String)),
    startY: 28,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    margin: { left: 10, right: 10 },
  })

  return new Uint8Array(doc.output('arraybuffer'))
}
