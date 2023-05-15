import DataProvider from "@/utils/DataProvider"

export default async function handler(req, res) {
	const { id } = req.query
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {
		url: "/board/" + id,
		mode: 'GET'
	}
	var board = await globalThis.dataProvider.xfr(params)
	res.status(200).json(board)
}
