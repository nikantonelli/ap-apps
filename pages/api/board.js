/**
 * Translate from our API to the AgilePlace one
 * Incoming:
 * 		http://nacl.leankit.com/api/board
 * or 	http://nacl.leankit.com/api/board?fld=title&q=MyCard
 * 
 * where 	fld = fieldname to search on
 * 			q = text string to look for
 * 
 */

import DataProvider from "../../utils/DataProvider"


export default async function handler(req, res) {
	const queryField = req.query['fld'];
	const queryStr = req.query['q'];
	
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}

	var result = await globalThis.dataProvider.getContextByString(queryField, queryStr)
	res.status(200).json({ boards: result.boards })
}
