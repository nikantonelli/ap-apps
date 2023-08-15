import { union, unionBy } from "lodash";
import { shortDate } from "./Helpers";

export class VIEW_TYPES {
	static SUNBURST = 'sunburst'
	static TREE = 'tree'
	static PARTITION = 'parition'
	static TIMELINE = 'timeline'
}

export const getCardChildren = async (host, card) => {
	var params = {
		host: host,
		mode: "GET",
		url: "/card/" + card.id + "/connection/children?cardStatus=notStarted,started,finished",
	}
	return await doRequest(params);
}

/** 
 * Coded like this because we usually have to 'refetch' the REAL version 
 * of a nonsense one back from a different api call.
*/
export const getCard = async (host, card) => {
	var params = {
		host: host,
		mode: "GET",
		url: "/card/" + card.id,
	}
	return await doRequest(params);
}

export const getCardHierarchy = async (host, card, type, depth) => {
	if (depth < 0) return //We're done
	
	var level = depth - 1;
	switch (type) {
		case 'children':{
			var result = await getCardChildren(host, card);
			var children = await result.json()
			if (children.cards && children.cards.length) {
				if (!card.children) {
					card.children = children.cards
				} else {
					card.children = unionBy(card.children, children.cards, (card) => card.id)
				}
				for (var i = 0; i < children.cards.length; i++) {
					await getCardHierarchy(host, children.cards[i], type, level)
				}
				//children.cards.forEach((card) => { getCardHierarchy(host, card, type, level) })	
			}		
		}
	}
	return card
}

/** If a top level card is a child of something else in the hierarchy, then remove from the top layer */
export const removeDuplicates = (cards) => {
	var checkedCards = cards;

	cards.forEach((card) => {
		checkedCards = filter(checkedCards, (cc) => {
			return !filter(card.children, (child) => {
				return child.id === cc.id
			})
		})
	})
	return checkedCards
}

export const  flattenTree = (array, result) => {
	array.forEach(function (el) {
		if (el.children) {
			flattenTree(el.children, result);
		}
		result.push(el);

	});
}

export const findBoards = async (host, options) => {
	var params = {
		url: "/board",
		mode: "GET",
		host: host
	}
	if (options && options.search) {
		//Extra params are uri encoded at the lower level.
		params.search = "q=" + options.search
	}
	var result = await doMultiRequest(params, "boards")
	if (result)
		return result
	else return null

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

/**
 *  Get all the pages of data available
 * @param {*} params 
 * @returns 
 */
export const doMultiRequest = async (params, itemType) => {
	var ps = { method: params.mode }
	if (params.body) {
		ps.body = params.body
	}
	if (params.type) {
		var headers = new Headers();
		headers.append("Content-Type", params.type)
		ps.headers = headers
	}
	var moreItems = true;
	var data = [];
	var currentItem = 0;
	var extras = "";

	if (params.search) extras += "&" + params.search

	while (moreItems) {
		//The NextJs bit requires the 'http:<host>' parameter to be present. THe browser copes without it.
		var response = await fetch(new Request(encodeURI("http://" + params.host + "/api" + params.url + "?offset=" + currentItem + extras), ps))
		var res = await response.json();
		if (res) {
			currentItem = res.pageMeta.endRow
			if (res.pageMeta.totalRecords <= currentItem) moreItems = false;
			res[itemType].forEach(d => data.push(d));
		}
		else
			return null;
	}
	res[itemType] = data;
	res.pageMeta.startRow = 1;
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