import DataProvider from "../../../Utils/Server/DataProvider"

export default async function handler(req, res) {
	const { id } = req.query

	if (!Boolean(globalThis.dataProvider)) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {
		url: "/board/" + id,
		mode: 'GET'
	}
	var result = globalThis.dataProvider.inCache(id, 'board');
	if ( result == null ) {
		result = await globalThis.dataProvider.xfr(params)
		globalThis.dataProvider.addToCache(result, 'board');
	}
	
	res.status(200).json(result)
}
