import DataProvider from "../../../../../utils/Server/DataProvider"

export default async function handler(req, res) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {
		url: "/card/" + req.query.id + "/connection/children?cardStatus=" + req.query.cardStatus,
		mode: 'GET'
	}

	var result = globalThis.dataProvider.inCache(params.url, 'children')
	if (result === null) {
		result = await globalThis.dataProvider.xfr(params)
		if (result) {
			globalThis.dataProvider.addToCacheWithId(params.url, result.cards, 'children')
			res.status(200).json({ cards: result.cards })
			return;
		}	
	} else {
		res.status(200).json({ cards: result })
		return;
	}
	res.status(400).json({error:true, message: "No children info available"})

}