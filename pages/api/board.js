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
	const queryField = req.query['fld'];
	const queryStr = req.query['q'];

	var findStr = null;
	var standardFilter = true;

	/**
	 * For the moment, AP does not search on anything but name and title
	 * If we want to search on anything else, we have to fetch them all and then select the ones we want
	 */
	if (queryStr) {
		if ((queryField) && (queryField !== "title") && (queryField !== "name")) {
			standardFilter = false
		}
	}

	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = DataProvider.get()
	}

	var brds = []
	if (standardFilter) {
		var searchTxt = "";
		if (queryStr) searchTxt = "?search=" + queryStr;
		var params = {
			url: "/board" + searchTxt
		}
		brds = await globalThis.dataProvider.xfr(params)
	} else {
		/**
		 * TODO: Fetch all and filter ourselves
		 */
	}
	res.status(200).json({ boards: brds.boards })
}
