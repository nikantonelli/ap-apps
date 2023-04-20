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
		console.log("bs: ",this.baseUrl + params.url, { method: params.mode })
		var req = new Request(this.baseUrl + params.url, { method: params.mode });
		var response = await fetch(req, {next: {revalidate: 30}});
		//Deal with paging here
		return response;
	}
}
export default BoardService;