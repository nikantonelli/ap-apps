import DataProvider  from "../../../utils/Server/DataProvider"

export default async function handler(req, res) {
	const { id } = req.query;

	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {
		url: "/card/list",
		mode: 'POST',
		body: JSON.stringify(req.body)
	}
	try {
	var result = await globalThis.dataProvider.xfr(params)
	res.status(200).json(result)
	}
	catch(err) {
		res.status(400).json({ error: "Failed to complete command", message: params})
	}
}
