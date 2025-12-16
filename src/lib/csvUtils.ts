export function convertToCSV(data: any[], filename: string) {
    if (!data.length) {
        alert("No data to export");
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(","), // Header row
        ...data.map(row => headers.map(fieldName => {
            const val = row[fieldName];
            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val; // Escape quotes
        }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
