import { notifyChange } from "../../../Utils/Client/Sdk";
import DataProvider  from "../../../Utils/Server/DataProvider"

export default async function handler(req, res) {
	switch (req.method) {
		case 'GET': {
			return GET(req, res)
		}
		case 'PATCH': {
			return PATCH(req, res)
		}
		default: {
			res.status(405).json({ error: `Verb ${req.method} not supported for cards`})
			return;
		}
	}
}

export async function GET(req, res) {
	const { id } = req.query;

	if (!Boolean(globalThis.dataProvider)) {
		globalThis.dataProvider = new DataProvider()
	}

	var params = {
		url: "/card/" + id,
		mode: 'GET'
	}
	var result = globalThis.dataProvider.inCache(id, 'card');
	if ( result === null ) {
		result = await globalThis.dataProvider.xfr(params)
		globalThis.dataProvider.addToCache(result, 'card');
	}

	res.status(200).json(result)
}

export async function PATCH(req, res) {
	const resBody = await req.body
	const { id } = req.query;

	if (!Boolean(globalThis.dataProvider)) {
		globalThis.dataProvider = new DataProvider()
	}
	
	var params = {
		url: "/card/" + id,
		mode: 'PATCH',
		body: resBody
	}
	var result = await globalThis.dataProvider.xfr(params)
	if ( result !== null ) {
		globalThis.dataProvider.addToCacheWithId(id, result, 'card');
		notifyChange('card', id)
		res.status(200).json(result)
	} else {
		res.status(400).json({ error: `Cannot update card ${id} with \n${resBody}`})
	}
}
