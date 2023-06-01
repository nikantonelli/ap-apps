export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function shortDate(dateString) {
	return new Date(dateString).toDateString();
}