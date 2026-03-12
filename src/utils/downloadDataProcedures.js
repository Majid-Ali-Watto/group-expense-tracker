import html2pdf from 'html2pdf.js'
import * as XLSX from 'xlsx'
import { startLoading, stopLoading } from './loading'
async function downloadPDF(pdfContent, fileName = 'Details-Sheet', title = '', subtitle = '') {
  const loading = startLoading()
  const options = {
    margin: 0.5,
    filename: fileName + new Date().toLocaleString() + '.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: {
      scale: 5,
      logging: false,
      backgroundColor: '#ffffff'
    },
    jsPDF: {
      unit: 'in',
      format: 'a3',
      orientation: 'portrait'
    },
    enableLinks: true
  }

  // Add CSS to handle page breaks for table rows
  const style = document.createElement('style')
  style.innerHTML = `
        table tr {
            page-break-inside: avoid;
        }
        .html2pdf__page-break {
            display: block;
            height: 0;
            page-break-before: always;
        }
    `
  document.head.appendChild(style)

  // Inject header at the top of the captured content
  const headerDiv = document.createElement('div')
  headerDiv.style.cssText =
    'text-align:center;padding:12px 0 10px;border-bottom:2px solid #22c55e;margin-bottom:16px;'
  headerDiv.innerHTML = `
    <div style="font-size:22px;font-weight:700;color:#22c55e;letter-spacing:.04em;">Kharchafy</div>
    ${
      title
        ? `<div style="font-size:14px;font-weight:600;color:#1f2937;margin-top:4px;">${title}</div>`
        : ''
    }
    ${
      subtitle
        ? `<div style="font-size:12px;color:#4b5563;margin-top:3px;">${subtitle}</div>`
        : ''
    }
    <div style="font-size:11px;color:#6b7280;margin-top:3px;">Downloaded at: ${new Date().toLocaleString()}</div>
  `
  pdfContent.insertBefore(headerDiv, pdfContent.firstChild)

  // Temporarily hide or remove buttons
  const buttons = pdfContent.querySelectorAll('button, .no-pdf') // Add your selector for elements to exclude
  buttons.forEach((btn) => (btn.style.display = 'none'))
  // Select all elements with the class 'el-badge' and 'el-select'
  const badges = pdfContent.querySelectorAll('.el-badge')
  const selects = pdfContent.querySelectorAll('.el-select')

  // Hide each 'el-badge' and 'el-select' element
  badges.forEach((badge) => {
    badge.style.display = 'none'
  })

  selects.forEach((select) => {
    select.style.display = 'none'
  })
  // Return a Promise that resolves after download completes
  return new Promise((resolve, reject) => {
    html2pdf()
      .set(options)
      .from(pdfContent)
      .toPdf()
      .get('pdf')
      .then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages()
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i)
          // thin separator line above footer
          pdf.setDrawColor(180, 180, 180)
          pdf.setLineWidth(0.005)
          pdf.line(0.4, pageHeight - 0.45, pageWidth - 0.4, pageHeight - 0.45)
          // footer text — dark enough to read
          pdf.setFontSize(9)
          pdf.setTextColor(80, 80, 80)
          pdf.text(`Page ${i} of ${totalPages}`, 0.4, pageHeight - 0.28)
          pdf.text('Kharchafy', pageWidth / 2, pageHeight - 0.28, { align: 'center' })
          pdf.text('g-exp-trk.netlify.app', pageWidth - 0.4, pageHeight - 0.28, { align: 'right' })
        }
      })
      .save()
      .then(() => {
        resolve()
      })
      .catch((error) => {
        reject(error)
      })
      .finally(() => {
        // Restore buttons after PDF generation
        buttons.forEach((btn) => (btn.style.display = ''))
        badges.forEach((badge) => {
          badge.style.display = ''
        })
        selects.forEach((select) => {
          select.style.display = ''
        })
        headerDiv.remove()
        document.head.removeChild(style)
        stopLoading(loading)
      })
  })
}

function downloadExcel(data = [], fileName = '', sheetName = 'Expenses') {
  const loading = startLoading()
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, fileName + new Date().toLocaleString() + '.xlsx')
  stopLoading(loading)
}
export { downloadPDF, downloadExcel }
