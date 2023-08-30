import { findIndex, forEach, pullAt, slice, union, unionBy } from "lodash";
import { shortDate } from "./Helpers";

export class VIEW_TYPES {
	static SUNBURST = 'sunburst'
	static TREE = 'tree'
	static PARTITION = 'partition'
	static TIMELINE = 'timeline'
}

export const getCardChildren = (host, card) => {
	var params = {
		host: host,
		mode: "GET",
		url: "/card/" + card.id + "/connection/children?cardStatus=notStarted,started,finished",
	}
	return doRequest(params);
}

/** 
 * Coded like this because we usually have to 'refetch' the REAL version 
 * of a nonsense one back from a different api call.
*/
export const getCard = (host, cardId) => {
	var params = {
		host: host,
		mode: "GET",
		url: "/card/" + cardId,
	}
	return doRequest(params);
}

export const getCards = (host, cardIds) => {
	var reqs = []
	if (cardIds.constructor.toString().indexOf("Array") < 0) return null;
	cardIds.forEach(async (crd) => {
		var card = getCard(host, crd)
		reqs.push(card)
	})
	return Promise.all(reqs).then((results) => {
		var cards = [];
		results.forEach((result) => {
			cards.push(result)
		})
		return cards
	})
}


/**
 * 
 * @param {*} host 
 * @param {*} card 
 * @param {*} type 
 * @param {*} depth 
 * @returns A partial Card
 * 
 * The AgilePlace API returns different card structures depending on what call you make
 * This is a bit of a pain as it means that most times you have to get the card twice 
 * if you want ALL the fields
 * In the case that you want all the fields, flatten the tree and then get all the cards
 * and replace each one back into the tree
 */
export const getCardHierarchy = async (host, card, type, depth) => {

	return new Promise(async (resolve, reject) => {

		var level = depth - 1;
		switch (type) {
			case 'children': {
				if (level < 0) {
					resolve(card)
				} else {
					var result = await getCardChildren(host, card);

					if (result.cards && result.cards.length) {
						var cardIds = result.cards.map((c) => {
							return c.id
						})
						var realCards = await getCards(host, cardIds)
						var grc = Promise.all(getRealChildren(host, realCards, level)).then((results) => {

							if (!card.children) {
								card.children = realCards
							} else {
								card.children = unionBy(card.children, realCards, (c) => c.id)

							}
							card.children.forEach((c) => {
								c.parentId = card.id	//We set this to recreate a tree from d3.stratify if needed
							})
							resolve(card);
						})
					} else {
						resolve(card)
					}
				}
			}
		}

	})
}


export function getRealChildren(host, cards, depth) {
	console.log("grc", depth, cards)
	var reqs = [];
	if (cards.constructor.toString().indexOf("Array") < 0) return [];
	cards.forEach(async (card) => {
		reqs.push(getCardHierarchy(host, card, 'children', depth))
	})
	// return Promise.all(reqs).then((results) => {
	// 	var newCards = [];
	// 	results.forEach((result) => {
	// 		newCards.push(result)
	// 	})
	// 	return newCards;
	// })
	return reqs;
}

/** If a top level card is a child of something else in the hierarchy, then remove from the upper layer
 *  This relies on an array arranged by a nodes followed by their children in topological order as per
 *  the d3 based: node.descendants()
 */
export const removeDuplicates = (cards) => {
	var removeIndexes = []
	cards.forEach((card, idx) => {
		var cardsToCheck = slice(cards, 0, idx)
		var pIdx = -1;
		if (findIndex(cardsToCheck,
			function (c,) {
				return c.id === card.id
			}) >= 0) {
			removeIndexes.push(findIndex(cards, { id: card.id }))	// findIndex finds the original one first
		}
	})
	pullAt(cards, removeIndexes)
	return cards
}

export const flattenTree = (array, result) => {
	array.forEach(function (el) {

		result.push({ ...el });
		if (el.children) {
			flattenTree(el.children, result);
		}
	});
}

export const visitTree = (treeNode, sizFnc, previous) => {
	var prev = previous;

	forEach(treeNode.children, (item) => {
		prev = visitTree(item, sizFnc, prev)
	})
	return sizFnc(treeNode, prev);
}

export const createTree = (cards) => {
	var tree = {id: 'root'}
	addChildrentoTree(tree, cards)
	return tree.descendants;
}

const addChildrentoTree = (item, cards) => {
	cards.forEach((c) => {
		if (c.parentId === item.id){
			addChildrentoTree(c, cards)
			item.descendants = 
			item.descendants? 
			item.descendants = unionBy(item.descendants, [c]) : 
			[c]
		}
	})
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
	return doRequest(params);
}

export const getBoard = async (host, brdId) => {
	var params = {
		host: host,
		mode: 'GET',
		url: "/board/" + brdId
	}
	return doRequest(params);
}
export const getBoardIcons = async (host, brdId) => {
	var params = {
		host: host,
		mode: 'GET',
		url: "/board/" + brdId + "/customIcon"
	}
	return doRequest(params);
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
	var res = await fetch(req, { next: { revalidate: 30 } }).then(
		async (response) => {
			if (response.ok) {
				return response
			} else return null;
		}
	)
	var data = null;
	if (res) data = await res.json()
	return data
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
		var response = await fetch(new Request("http://" + params.host + "/api" + params.url + "?offset=" + currentItem + encodeURI(extras), ps))
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