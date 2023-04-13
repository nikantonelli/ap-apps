import AgilePlace from "./AgilePlace"

export const DataProvider = {
	get: function() {
		return new AgilePlace(process.env.AGILEPLACE, process.env.AGILEUSER, process.env.AGILEPASS, process.env.AGILEKEY)
	}
}