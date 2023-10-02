import DataProvider from "../../../Utils/Server/DataProvider"

export default async function handler(req, res) {
	const { id } = req.query

	if (!Boolean(globalThis.dataProvider)) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {
		raw: true,
		type: "image/jpeg",
		url: "/avatar/show/" + id + "/?s=25",
		mode: 'GET'
	}
	var result = globalThis.dataProvider.inCache(id, 'avatar');
	if (result === null) {
		result = await globalThis.dataProvider.xfr(params)
		if (result) globalThis.dataProvider.addToCacheWithId(id, result, 'avatar');
	}

	if (result) {
		//Convert blob to bytes and send back
		res.setHeader("Content-Type", params.type)
		res.writeHead(200, {
			"Content-Type": "image/jpeg",
			"Content-Length": result.length
		})
		res.end(result)
	}
	else {
		res.status(400).json({ "Error": `avatar fetch for ${id} returned null` })
	}
}