

import  DataProvider from "../../Utils/Server/DataProvider"

export default async function handler(req, res) {
	
	if (!Boolean(globalThis.dataProvider)) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {
		mode: 'GET',
		url: req.url.substring(4)
	}

	var cards = await globalThis.dataProvider.xfr(params)

	if (cards)	res.status(200).json({ cards: cards.cards })
	else res.status(400).json({error: true, message:"Can't fetch card"})
}
