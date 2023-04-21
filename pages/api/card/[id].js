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

import { DataProvider } from "@/utils/DataProvider";

export default async function handler(req, res) {
	const id = req.query['id'];

	var params = {
		url: "/card" + id,
		mode: 'GET'
	}
	brds = await globalThis.dataProvider.xfr(params)

	if (brds) res.status(200).json(brds.boards)
	else res.status(400).json({ error: "Failed to fetch" })
}
