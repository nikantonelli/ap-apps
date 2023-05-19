
export const getCardChildren = async (host, card) => {
	var params = {
		host: host,
		mode: "GET",
		url: "/card/" + card.id + "/connection/children?cardStatus=notStarted,started,finished",
	}
	return await doRequest(params);
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
		url: "/board/" + brdId +"/customIcon" 
	}
	return await doRequest(params);
}

export const doRequest = async (params) => {
	console.log(params)
	var ps = { method: params.mode }
	if (params.body) {
		ps.body = params.body
	}
	if (params.type) {
		var headers = new Headers();
		headers.append("Content-Type", params.type)
		ps.headers = headers
	}
	var req = new Request("http://" + params.host + "/api" + params.url, ps);
	var res = await fetch(req, { next: { revalidate: 30 } })
	return res
}