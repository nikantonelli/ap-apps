import { BroadcastChannel } from "broadcast-channel";
import React from "react";
import { io } from "socket.io-client";
import { VIEW_TYPES } from "../utils/Client/Sdk";
import APBoard from "../Components/APBoard";

export default class App extends React.Component {
    constructor(props) {
        super(props);

		var stateDepth = this.props.depth || APBoard.DEFAULT_TREE_DEPTH
		if (stateDepth < 0) stateDepth = 99;	//If -1 passed in, then do as much as anyone stupid would want.
		
		
        this.state = {
			popUp: null,
            resizeCount: 0,
			depth: stateDepth,
			mode: this.props.mode || VIEW_TYPES.TREE,
			colouring: this.props.colour || 'type',
			colourise: this.typeColouring,
			grouping: this.props.group || 'level',
			showErrors: this.props.eb || 'off',
			sortType: this.props.sort || 'none',
			sortDir: this.props.dir || 'ascending',
			
			configOpen: false,
			drawerWidth: this.props.drawerWidth || 400,
        }
        
        this.itemsOfInterest = {
            cards: [],
            boards: []
        };

        // if (!globalThis.bc) {
		// 	globalThis.bc = new BroadcastChannel("nui_socket_ch")
		// 	this.bc = globalThis.bc;
			
		// } else {
		// 	this.bc = new BroadcastChannel("nui_socket_ch");
		// 	this.bc.onmessage = (event) => {
		// 		console.log(event);
		// 	}
		// }

	
		// if (!globalThis.ws) {
		// 	globalThis.ws = io()

		// 	globalThis.ws.on('connect', () => {
		// 		console.log('connected')
		// 	})
		// 	globalThis.ws.on('update-item', (msg) => {
		// 		console.log('update', msg)
		// 		globalThis.bc.postMessage({
		// 			type: "update",
		// 			data: msg
		// 		})
		// 	})
		// }
		// //Connect to endpoint to establish socket set up on server
		// fetch("/api/socket");
    }
    
	
	closePopUp = () => {
		this.setState({ popUp: null })
	}

	//Config drawer
	
	openDrawer = () => {
		this.setState({ configOpen: true })
	}

	closeDrawer = () => {
		this.setState({ configOpen: false })
	}

	/**
	 * Two stage colour fetching:
	 * 1. Optional: Set up a function to convert a value to a colour
	 * 2. Call a function (that could call that previous function) with the 'd' parameter
	 * 	that converts d to a value.
	 * 
	 * You could, of course, only have one function that converts 'd' to a colour
	 */
	colourFnc = null;

	tempColouring = (d) => {
		var mine = this.searchNodeTree(this.rootNode, d.data.id)
		while (mine.parent && mine.parent.data.id != 'root') {
			mine = mine.parent;
		}
		return this.colourFnc((mine ? mine.index : 1) + 1);
	}

	typeColouring = (d) => {
		if (d.data) return d.data.type.cardColor
		else return "#ccc"
	}

	//Get first assigned user only
	aUserColouring = (d) => {
		var user = null;
		//Assigned users is always returned and empty if there are none
		if (d.data.assignedUsers.length) {
			user = d.data.assignedUsers[0];
			var index = _.findIndex(this.assignedUserList, function (assignee) {
				return user.id === assignee.id;
			})
			if (index >= 0) return this.colourFnc(index);
		}
		return this.colourFnc(0);
	}

	lUserColouring = (d) => {
		var user = null;
		//last update users is always returned and empty if there are none
		if (d.data.updatedBy) {
			user = d.data.updatedBy;
			var index = _.findIndex(this.updatedUserList, function (assignee) {
				return user.id === assignee.id;
			})
			if (index >= 0) return this.colourFnc(index);
		}
		return this.colourFnc(0);
	}

	cUserColouring = (d) => {
		var index = -1;
		//creator users is always returned and empty if there are none
		if (d.data.createdBy) {
			index = _.findIndex(this.createdUserList, function (user) {
				return d.data.createdBy.id === user.id;
			})
		}
		var colour = this.colourFnc((index >= 0) ? index : 0);
		return colour
	}

	contextColouring = (d) => {
		var boardid = d.data.board.id
		var index = _.findIndex(this.contextList, function (context) {
			return boardid === context.id;
		})
		if (index >= 0) return this.colourFnc(index);

		return this.colourFnc(0);
	}

	stateColouring = (d) => {
		if (d.data.actualFinish) return '#444444'
		if (d.data.actualStart) return '#27a444';
		else return '#4989e4';

	}

	/**
	 * 
	 * @param {
	 * 	type: string
	 * 	method: function
	 * 	config: object
	 * 
	 * } params 
	 */
	setColouring = (params) => {
		switch (params.colouring) {
			case 'cool': {
				this.colourFnc = scaleOrdinal(quantize(interpolateCool, (this.rootNode.children && this.rootNode.children.length) ? this.rootNode.children.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.tempColouring });
				break;
			}
			case 'warm': {
				this.colourFnc = scaleOrdinal(quantize(interpolateWarm, (this.rootNode.children && this.rootNode.children.length) ? this.rootNode.children.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.tempColouring });
				break;
			}
			case 'context': {
				this.colourFnc = scaleOrdinal(quantize(interpolateRainbow, this.contextList.length ? this.contextList.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.contextColouring });
				break;
			}
			case 'type': {
				this.setState({ colouring: params.colouring, colourise: this.typeColouring });
				break;
			}
			case 'state': {
				this.setState({ colouring: params.colouring, colourise: this.stateColouring });
				break;
			}
			case 'a_user': {
				this.colourFnc = scaleOrdinal(quantize(interpolateRainbow, this.assignedUserList.length ? this.assignedUserList.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.aUserColouring });
				break;
			}
			case 'l_user': {
				this.colourFnc = scaleOrdinal(quantize(interpolateRainbow, this.updatedUserList.length ? this.updatedUserList.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.lUserColouring });
				break;
			}
			case 'c_user': {
				this.colourFnc = scaleOrdinal(quantize(interpolateRainbow, this.createdUserList.length ? this.createdUserList.length + 1 : 2))
				this.setState({ colouring: params.colouring, colourise: this.cUserColouring });
				break;
			}
			default: {
				this.setState({ colouring: params.colouring })
				this.colourFnc = scaleOrdinal(quantize(interpolateCool, 2))
			}
		}

	}
	resize = () => {
		this.setState((prev) => { return { resizeCount: prev.resizeCount + 1 } })
	}
}