import DataProvider from "../../../utils/Server/DataProvider"

/**
 * If a series (AP terms) request, use
 * http://host/api/timebox/1234
 * or if wanting a subincrement use
 * http://host/api/timebox/1234?incr=67889
 * 
 * @param {*} req 
 * @param {*} res 
 */
export default async function handler(req, res) {
	const { id, incr="" } = req.query
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {}
	if (!incr) {
		params = {
			url: "/series/" + id,
			mode: 'GET'
		}
	} else if (incr === "all") {
		params = {
			url: "/series/" + id + "/increment",
			mode: 'GET'
		}
	} else {
		params = {
			url: "/series/" + id + "/increment/" + incr,
			mode: 'GET'
		}
	}
	var timebox = null;
	if (globalThis.dataProvider) {
		timebox = globalThis.dataProvider.inCache(id+incr, 'timebox')
		if (timebox) res.status(200).json(timebox)
	}
	if (!timebox) {
		timebox = await globalThis.dataProvider.xfr(params)
		if (timebox) {
			globalThis.dataProvider.addToCacheWithId(id+incr, timebox, 'timebox')
			res.status(200).json(timebox)
		}
	}
	if (!timebox) res.status(400).json({ error: "Invalid Timebox Request", message: params })
}