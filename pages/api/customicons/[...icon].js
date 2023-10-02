import DataProvider from "../../../Utils/Server/DataProvider"

export default async function handler(req, res) {

	if (!Boolean(globalThis.dataProvider)) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {
		mode: 'GET',
		url: req.url.substring(4),
		raw: true,
		type: 'image/png'
	}

	var result = globalThis.dataProvider.inCache(params.url, 'png')
	if (result === null) {
		result = await globalThis.dataProvider.xfr(params)
		if (result) {
			globalThis.dataProvider.addToCacheWithId(params.url, result, 'png')
		}
	}
	if (result) {

		res.writeHead(200, { 'Content-Type': "image/png" })
		res.end(result)
	}
	else {
		res.status(400).end(`{error: true, message: Failed to fetch ${params.url}`)
	}
}
