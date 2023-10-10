class CardService {

	constructor() {
		if (!Boolean(globalThis.dataProvider)) {
			globalThis.dataProvider = new DataProvider()
		}
	}

	async find(options) {
		var params = {
			url: "/card/",
			mode: "GET"
		}
		var response = await this.getData(params);
		if (response) return response.cards;
		else return [];
	}

	async get(id, options) {
		var params = {
			url: "/card/" + id,
			mode: "GET"
		}
		var card = null;
		card = globalThis.dataProvider.inCache(id, 'card')

		if (!card) {
			card = await this.getData(params);
			if (card) globalThis.dataProvider.addToCacheWithId(id, card, 'card')
		}
		return card;
	}

	async getChildren(id, options) {
		var params = {
			mode: "GET",
			url: "/card/" + id + "/connection/children?cardStatus=notStarted,started,finished",
		}
		var response = await this.getData(params);
		if (response) return response.cards;
		else return [];
	}

	async getActiveChildren(id, options) {
		var params = {
			mode: "GET",
			url: "/card/" + id + "/connection/children?cardStatus=notStarted,started",
		}
		var response = await this.getData(params);
		if (response) return response.cards;
		else return [];
	}

	async getData(params) {
		console.log("cs: ", params.url, { method: params.mode })
		return await globalThis.dataProvider.xfr(params);
	}
}
export default CardService;