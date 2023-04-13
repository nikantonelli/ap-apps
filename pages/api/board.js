// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import AgilePlace from "@/utils/AgilePlace";

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
		globalThis.dataProvider = new AgilePlace(process.env.AGILEPLACE, process.env.AGILEUSER, process.env.AGILEPASS, process.env.AGILEKEY)
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
		 * Fetch all and filter ourselves
		 * TODO: 
		 */
	}
	res.status(200).json({ boards: brds.boards })
}
