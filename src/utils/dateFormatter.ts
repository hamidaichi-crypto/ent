export const formatDateTime = (isoString: string | null | undefined): string => {
    if (!isoString) {
        return '-'
    }
    try {
        const date = new Date(isoString)
        if (isNaN(date.getTime())) {
            return '-' // Invalid date
        }
        return date.toLocaleString() // Uses user's local time zone and format
    } catch (error) {
        console.error('Error formatting date:', error)
        return '-'
    }
}
