import DataProvider from "../utils/Server/DataProvider";

class BoardService {

	constructor(host) {
		this.baseUrl = "http://" + host + "/api";
		this.cache = null;
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
		if (globalThis.dataProvider)
			return await this.getData(params);
	}

	async getCards(id, options) {
		var params = {
			mode: "GET",
			url: "/board/cards/" + id
		}
		var response = await this.getData(params).then((result) => result.json())
		if (response) {
			//Deal with paging here
			return response.cards;
		}
		else return [];
	}

	async getData(params) {
		console.log("bs: ", this.baseUrl + params.url, { method: params.mode })
		if (!globalThis.dataProvider) {
			globalThis.dataProvider = new DataProvider();
		}
		return await globalThis.dataProvider.xfr(params);

	}
}
export default BoardService;