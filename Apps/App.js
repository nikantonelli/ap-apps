import { interpolateCool, interpolateRainbow, interpolateWarm, quantize, scaleOrdinal, hierarchy } from "d3";
import { findIndex, max } from "lodash";
import React from "react";
import { VIEW_TYPES } from "../utils/Client/Sdk";

export class AppRoot extends React.Component {
    	
    constructor(props) {
        super(props)
        this.state = {
            reqsPending: 0,
            reqsComplete: 0,
            total: 0,
            resizeCount: 0,
        }
    }
    countReset = () => {
        this.setState({reqsComplete: 0, reqsPending: 0})
    }
    
    countInc = () => {
        this.setState((prev) => {
            var next = prev.reqsPending + 1
            return { reqsPending: next }
        })
    }

    countDec = () => {
        this.setState((prev) => {
            var next = prev.reqsComplete + 1
            return { reqsComplete: next }
        })
    }
    
	resize = () => {
		this.setState((prev) => { return { resizeCount: prev.resizeCount + 1 } })
	}
}