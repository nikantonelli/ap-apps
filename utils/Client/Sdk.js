import { shortDate } from "./Helpers";

export const getCardChildren = async (host, card) => {
	var params = {
		host: host,
		mode: "GET",
		url: "/card/" + card.id + "/connection/children?cardStatus=notStarted,started,finished",
	}
	return await doRequest(params);
}

export const findBoards = async (host, options) => {
	var params = {
		url: "/board",
		mode: "GET",
		host: host
	}
	if (options && options.search) {
		params.url += "?q=" + encodeURIComponent(options.search)
	}
	return await doRequest(params)
	
}
export const getListOfCards = async (host, cardList) => {
	var params = {
		host: host,
		mode: 'GET',
		url: "/card?cards=" + cardList.toString()
	}
	return await doRequest(params);
}

export const getBoard = async (host, brdId) => {
	var params = {
		host: host,
		mode: 'GET',
		url: "/board/" + brdId
	}
	return await doRequest(params);
}
export const getBoardIcons = async (host, brdId) => {
	var params = {
		host: host,
		mode: 'GET',
		url: "/board/" + brdId + "/customIcon"
	}
	return await doRequest(params);
}

export const doRequest = async (params) => {
	var ps = { method: params.mode }
	if (params.body) {
		ps.body = params.body
	}
	if (params.type) {
		var headers = new Headers();
		headers.append("Content-Type", params.type)
		ps.headers = headers
	}
	//The NextJs bit requires the 'http:<host>' parameter to be present. THe browser copes without it.
	var req = new Request("http://" + params.host + "/api" + params.url, ps);
	var res = await fetch(req, { next: { revalidate: 30 } })
	return res
}

export const statusString = (card) => {
	return ((card.actualFinish?.length) ?
		" Finished (" + shortDate(card.actualFinish) + ")" :
		(card.actualStart?.length) ?
			" Started (" + shortDate(card.actualStart) + ")" :
			" Not Started"

	)
}