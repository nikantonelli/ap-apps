class BoardService {
	/**
	 * 
	 * @param {object to access AgilePlace} apiAccess 
	 */
	constructor(apiAccess) {
		this.cache = null;
	}

	find(options) {
		var params = {
			url: "/board/",
			method: "GET"
		}
		return this.getData(params);
	}

	get(id, options) {
		var params = {
			url: "/board/" + id,
			method: "GET"
		}
		return this.getData(params);
	}

	getCards(id, options) {
		var params = {
			method: "GET",
			url: "/board/" + id + "/card",
		}
		return this.getData(params)
	}

	async getData(params) {

		if (globalThis.dataProvider) {
			var response = await globalThis.dataProvider.xfr(params);
			if (response) {
				//Deal with paging
				return response.data;
			}
		}
		return null;
	}
}
export default BoardService;