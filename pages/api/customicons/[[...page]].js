/**
 * Translate from our API to the AgilePlace one
 * Incoming:
 * 		http://localhost:3000/nui/api/card
 * or 	http://localhost:3000/nui/api/card?search=title&select=both
 * or  	http://localhost:3000/nui/api/card?cards=123456,43212,987656
 * 
 * Outgoing: direct to AP after URL replacement
 * 
 */

import DataProvider from "@/utils/DataProvider";

export default async function Page(req, res) {
	
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {
		mode: 'GET',
		url: req.url.substring(4),
		raw: true
	}

	console.log("in fetch", params)
	var cards = await globalThis.dataProvider.xfr(params)

	if (cards)	res.status(200).json({ cards: cards.cards })
	else res.status(400).json({ error: "failed to fetch cards", ...params})
}
