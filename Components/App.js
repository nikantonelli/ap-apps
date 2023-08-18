import { BroadcastChannel } from "broadcast-channel";
import React from "react";
import { io } from "socket.io-client";

export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            resizeCount: 0
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
    
	resize = () => {
		this.setState((prev) => { return { resizeCount: prev.resizeCount + 1 } })
	}
}