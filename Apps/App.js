import { interpolateCool, interpolateRainbow, interpolateWarm, quantize, scaleOrdinal, hierarchy } from "d3";
import { findIndex, max } from "lodash";
import React from "react";
import { VIEW_TYPES } from "../utils/Client/Sdk";

export class AppRoot extends React.Component {
    	
    constructor(props) {
        super(props)
        this.state = {
            pending: 0,
            total: 0,
            resizeCount: 0,
        }
    }
    countInc = () => {
        this.setState((prev) => {
            var next = prev.pending + 1
            return { pending: next, total: max([prev.total, next]) }
        })
    }

    countDec = () => {
        this.setState((prev) => {
            return { pending: prev.pending - 1 }
        })
    }
    
	resize = () => {
		this.setState((prev) => { return { resizeCount: prev.resizeCount + 1 } })
	}
}