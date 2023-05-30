import DataProvider from "../../../../../utils/Server/DataProvider"

export default async function handler(req, res ) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}

	var prms = {
		url: "/card/" + req.query.id + "/connection/children?cardStatus=" + req.query.cardStatus,
		mode: 'GET'
	}

		var result = await globalThis.dataProvider.xfr(prms)
		if (result) {
		res.status(200).json({ cards: result.cards })
	} else {
		res.status(400).json({})
	}
}