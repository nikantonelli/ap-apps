import { Grid } from "@mui/material";
import { sortBy, unionBy } from "lodash";
import React from "react";
import { VIEW_TYPES, flattenChildren } from "../utils/Client/Sdk";
import { App } from "./App";

export class APAllocationView extends App {

    constructor(props) {
        super(props);
        this.mode = VIEW_TYPES.ALLOCATION

        this.state = {
            popoverId: null,
            popoverEl: null
        }
        this.errorData = props.errorData || this.nullErrorData
        this.cards = this.props.cards || []
    }

    nullErrorData = () => {
        return {
            msg: "",
            colour: "#ff0000"
        }
    }

    typeOrder = (tree) => {
        var nodeArray = []
        flattenChildren(tree, nodeArray)
        return sortBy(nodeArray, [function (c) { return c.data.type.title }])
    }

    contextOrder = (tree) => {
        var nodeArray = []
        flattenChildren(tree, nodeArray)
        return sortBy(nodeArray, [function (c) { return c.data.board.title }])
    }

    popoverOpen = (evt) => {
        this.setState({ popoverEl: evt.currentTarget, popoverId: evt.currentTarget.id });
    }

    popoverClose = (evt) => {
        this.setState({ popoverEl: null, popoverId: null });
    }

    componentDidMount() {
        //Get the sub-increments of the planning increment and work out the earliest and last date
        //and make sure they are in date order.... just in case....
        var timeboxes = sortBy(this.props.timebox.increments, (t) => t.startDate)
        var dates = []
        var overlap = false;
        var earliest = null;
        var latest = null;

        if (timeboxes.length) {
            dates.push({ start: new Date(timeboxes[0].startDate), end: new Date(timeboxes[0].endDate) })
            earliest = dates[0].start;
            latest = dates[0].end;
            for (var i = 1; i < timeboxes.length; i++) {
                dates.push({ start: new Date(timeboxes[i].startDate), end: new Date(timeboxes[i].endDate) })
                if (dates[i].start < earliest) earliest = dates[i].start
                if (dates[i].end > latest) latest = dates[i].end
                if (dates[i].start < dates[i - 1].end) overlap = true;
            }
            this.setState({ timeboxes: timeboxes, latest: latest, earliest: earliest, overlap: overlap })
        }
    }

    render() {

        var items = []
        switch (this.props.grouping) {
            case 'type': {
                this.cards.forEach((element) => {
                    items = unionBy(this.typeOrder(element), items, (item) => item.id)
                });
                break;
            }
            case 'context': {
                this.cards.forEach((element) => {
                    items = unionBy(this.contextOrder(element), items, (item) => item.id)
                });
                break;
            }
            default: {
                flattenChildren(this.cards, items)
                break;
            }
        }
        return (
            <Grid container>
                <Grid id="unallocated">

                </Grid>

            </Grid>
           
        )

    }
}