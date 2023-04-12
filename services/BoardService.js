class BoardService {
	/**
	 * 
	 * @param {object to access AgilePlace} apiAccess 
	 */
	constructor(apiAccess) {
		this.cache = null;
	}

	async find(options) {
		var params = {
			url: "/board/",
			mode: "GET"
		}
		var response = await this.getData(params)
		if (response) {
			//Deal with paging here
			return response.boards;
		}
		else return [];
	}

	async get(id, options) {
		var params = {
			url: "/board/" + id,
			mode: "GET"
		}
		return await this.getData(params);
	}

	async getCards(id, options) {
		var params = {
			mode: "GET",
			url: "/board/" + id + "/card",
		}
		var response = await this.getData(params)
		if (response) {
			//Deal with paging here
			return response.cards;
		}
		else return [];
	}

	async getData(params) {

		if (globalThis.dataProvider) {
			var response = await globalThis.dataProvider.xfr(params);
			//Deal with paging here
			return response;
		}
		return null;
	}
}
export default BoardService;