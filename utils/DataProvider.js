import AgilePlace from "./AgilePlace"

export const DataProvider = {
	get: function() {
		return new AgilePlace()
	}
}