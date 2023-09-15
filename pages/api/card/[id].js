import DataProvider  from "../../../Utils/Server/DataProvider"

export default async function handler(req, res) {
	const { id } = req.query;

	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {
		url: "/card/" + id,
		mode: 'GET'
	}
	var result = globalThis.dataProvider.inCache(id, 'card');
	if ( result == null ) {
		result = await globalThis.dataProvider.xfr(params)
		globalThis.dataProvider.addToCache(result, 'card');
	}

	res.status(200).json(result)
}
