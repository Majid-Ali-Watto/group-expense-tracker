import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import { startLoading, stopLoading } from "./loading";
async function downloadPDF(pdfContent, fileName = "Details-Sheet") {
	const loading = startLoading();
	const options = {
		margin: 0.5,
		filename: fileName + new Date().toLocaleString() + ".pdf",
		image: { type: "jpeg", quality: 1 },
		html2canvas: {
			scale: 5,
			logging: false,
			backgroundColor: "#ffffff"
		},
		jsPDF: {
			unit: "in",
			format: "a3",
			orientation: "portrait"
		}
	};

	// Add CSS to handle page breaks for table rows
	const style = document.createElement("style");
	style.innerHTML = `
        table tr {
            page-break-inside: avoid;
        }
        .html2pdf__page-break {
            display: block;
            height: 0;
            page-break-before: always;
        }
    `;
	document.head.appendChild(style);

	// Temporarily hide or remove buttons
	const buttons = pdfContent.querySelectorAll("button, .no-pdf"); // Add your selector for elements to exclude
	buttons.forEach((btn) => (btn.style.display = "none"));
	// Select all elements with the class 'el-badge' and 'el-select'
	const badges = pdfContent.querySelectorAll(".el-badge");
	const selects = pdfContent.querySelectorAll(".el-select");

	// Hide each 'el-badge' and 'el-select' element
	badges.forEach((badge) => {
		badge.style.display = "none";
	});

	selects.forEach((select) => {
		select.style.display = "none";
	});
	// Return a Promise that resolves after download completes
	return new Promise((resolve, reject) => {
		html2pdf()
			.set(options)
			.from(pdfContent)
			.save()
			.then(() => {
				resolve(); // Signal that download is complete
			})
			.catch((error) => {
				reject(error); // Signal error
			})
			.finally(() => {
				// Restore buttons after PDF generation
				buttons.forEach((btn) => (btn.style.display = ""));
				badges.forEach((badge) => {
					badge.style.display = ""; // Restore the original display style
				});

				selects.forEach((select) => {
					select.style.display = ""; // Restore the original display style
				});
				document.head.removeChild(style);
				stopLoading(loading);
			});
	});
}

function downloadExcel(data = [], fileName = "", sheetName = "Expenses") {
	const loading = startLoading();
	const ws = XLSX.utils.json_to_sheet(data);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, sheetName);
	XLSX.writeFile(wb, fileName + new Date().toLocaleString() + ".xlsx");
	stopLoading(loading);
}
export { downloadPDF, downloadExcel };
