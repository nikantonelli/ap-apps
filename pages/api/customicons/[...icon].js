import  DataProvider from "../../../utils/Server/DataProvider"

export default async function handler(req, res) {
	
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {
		mode: 'GET',
		url: req.url.substring(4),
		raw: true,
		type: 'image/png'
	}

	res.writeHead(200, {'Content-Type':"image/png"})
	res.end(await globalThis.dataProvider.xfr(params))
}
