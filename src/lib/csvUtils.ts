export function convertToCSV(data: any[], filename: string) {
    if (!data.length) {
        console.warn("No data to export");
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(","), // Header row
        ...data.map(row => headers.map(fieldName => {
            let val = row[fieldName];
            if (typeof val === 'string') {
                // CSV injection protection: prefix values that start with formula-triggering characters
                if (/^[=+\-@\t\r]/.test(val)) {
                    val = `'${val}`;
                }
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val; // Numbers, booleans, etc.
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
