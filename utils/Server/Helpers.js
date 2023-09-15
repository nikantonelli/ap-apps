export function extractOpts (query, appProps){
    if (query.srs) {
		appProps.series = query.srs;
	}
	if (query.tmb) {
		appProps.timebox = query.tmb;
	}
	if (query.active) {
		appProps.active = query.active;
	}
	if (query.mode) {
		appProps.mode = query.mode;
	}
	if (query.colour) {
		appProps.colour = query.colour;
	}
	if (query.sort) {
		appProps.sort = query.sort;
	}
	if (query.eb) {
		appProps.eb = query.eb;
	}
	if (query.dir) {
		appProps.dir = query.dir;
	}
	if (query.field) {
		appProps.field = query.field;
	}
	if (query.dedupe) {
		appProps.dedupe = true
	}
	if (query.panel) {
		appProps.panel = query.panel
	}
    return appProps;
}