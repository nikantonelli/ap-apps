export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function shortDate(dateString) {
	if (Boolean(dateString))
		return new Date(dateString).toDateString();
	else return "No Date"
}