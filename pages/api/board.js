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

import DataProvider from "../../Utils/Server/DataProvider"


export default async function handler(req, res) {
	const queryField = req.query['fld'];
	const queryStr = req.query['q'];
	const offset = req.query['offset'];
	
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}

	var result = await globalThis.dataProvider.getContextByString(queryField, queryStr, offset)
	
	if (result)	res.status(200).json({ pageMeta: result.pageMeta, boards: result.boards })
	else res.status(400).json({error: true, message:"Can't fetch boards"})
}
