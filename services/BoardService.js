import DataProvider from "../Utils/Server/DataProvider";
import CardService from "./CardService";

class BoardService {

	constructor() {
		if (!Boolean(globalThis.dataProvider)) {
			globalThis.dataProvider = new DataProvider()
		}
	}

	async find(options) {
		var params = {
			url: "/board",
			mode: "GET"
		}
		if (options && options.search) {
			params.url += "?q=" + encodeURIComponent(options.search)
		}
		var response = await this.getData(params)
		if (response) {
			//Deal with paging here
			return response;
		}
		else return [];
	}

	async get(id, options) {
		var params = {
			url: "/board/" + id,
			mode: "GET"
		}
		var board = null;
		if (globalThis.dataProvider) {
			board = globalThis.dataProvider.inCache(id, 'board')
		}
		if (board === null) {
			board = await this.getData(params);
			if (board) globalThis.dataProvider.addToCacheWithId(id, board, 'board')
		}
		return board;
	}

	async getCards(id, options) {
		var params = {
			mode: "POST",
			url: "/card/list",
			type: "application/json",
			body: JSON.stringify({
				"board": id,
				"only": ["id"],
				"lane_class_types": ["active", "backlog"]
			})
		}
		var cards = null;
		var cs = new CardService();
		cards = globalThis.dataProvider.inCache(id, 'cards')

		if (cards === null) {
			var result = await this.getData(params)
			if (result) {
				var newCards = [];
				cards = result.cards
				if (cards && cards.length) {
					for (var i = 0; i < cards.length; i++) {
						newCards.push(await cs.get(cards[i].id))
					}
					if (newCards.length) {
						globalThis.dataProvider.addToCacheWithId(id, newCards, 'cards')
					}
					return newCards;
				}
			}
		}
		return cards;
	}

	async getData(params) {
		console.log("bs: ", params.url, { method: params.mode })
		return await globalThis.dataProvider.xfr(params);

	}
}
export default BoardService;