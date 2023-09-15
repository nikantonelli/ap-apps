import { Box, Paper, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { filter, sortBy, unionBy } from "lodash";
import React from "react";
import { VIEW_TYPES, flattenChildren } from "../utils/Client/Sdk";
import { HierarchyApp } from "./HierarchyApp";
import PlanItem from "../Components/PlanningItem";

export class APAllocationView extends HierarchyApp {

    constructor(props) {
        super(props);

        this.state = {
            ...this.state,
            popoverId: null,
            popoverEl: null,
            mode: VIEW_TYPES.ALLOCATION,
            timeboxes: []
        }
        this.errorData = props.errorData || this.nullErrorData
        this.cards = this.props.cards || []
        this.cardWidth = 200;
        this.setup();
    }

    //Called from constructor, too, so no setState please.
    setup = () => {
        this.colourise = this.props.colourise || function () { return "#666666" }
        this.nodeClicked = this.props.onClick || null;
        this.errorData = this.props.errorData || function () { return { msg: "", colour: "" } }
        //These two are used by the routines in Sdk.js and not here
        this.colouring = this.props.colouring || 'type'
        this.sort = this.props.sort || 'none'
    }

    typeOrder = (items) => {
        return sortBy(items, [function (c) { return c.data.type.title }])
    }

    contextOrder = (items) => {
        return sortBy(items, [function (c) { return c.data.board.title }])
    }

    popoverOpen = (evt) => {
        this.setState({ popoverEl: evt.currentTarget, popoverId: evt.currentTarget.id });
    }

    popoverClose = (evt) => {
        this.setState({ popoverEl: null, popoverId: null });
    }

    componentDidUpdate = (prevProps, prevState) => {
        this.setup()
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

    calcData = () => {
        
        var items = [];
        flattenChildren(this.cards, items)

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
                break;
            }
        }
        return items;
    }

    render() {

        var items = this.calcData()
        var extraColumns = 2
        return (
            <>
                <Grid container columns={this.state.timeboxes.length + extraColumns}>
                    <>
                        <Grid xs id="allocated">
                            <Grid container>
                                <Grid sx={{ width: "100%" }} >
                                    <Paper square elevation={4} sx={{ margin: "3px", textAlign: "center" }}>
                                        <Typography sx={{ width: "100%" }} variant="body2">Allocated elsewhere</Typography>
                                    </Paper>
                                </Grid>
                                <Box sx={{ margin: "3px" }}>
                                    {items.map((itm, idx) => {
                                        if (Boolean(itm.planningIncrements) &&
                                            (itm.planningIncrements.length !== 0)
                                        ) {
                                            return (
                                                <Grid key={itm.id + idx}>
                                                    <PlanItem
                                                        onClick={this.nodeClicked}
                                                        width={this.cardWidth}
                                                        card={itm}
                                                        colourise={this.props.colourise} />
                                                </Grid>
                                            )
                                        }
                                        else {
                                            return null
                                        }
                                    })}
                                </Box>
                            </Grid>
                        </Grid>
                        <Grid xs id="unallocated">
                            <Grid container sx={{ alignContents: "center" }}>
                                <Grid sx={{ width: "100%" }}>
                                    <Paper square elevation={4} sx={{ margin: "3px", textAlign: "center" }}>
                                        <Typography sx={{ width: "100%" }} variant="body2">Unallocated</Typography>
                                    </Paper>
                                </Grid>

                                <Box sx={{ margin: "3px" }}>
                                    {items.map((itm, idx) => {
                                        if (!Boolean(itm.planningIncrements) || (itm.planningIncrements.length === 0)) {
                                            return (
                                                <Grid key={itm.id + idx}>
                                                    <PlanItem
                                                        onClick={this.nodeClicked}
                                                        width={this.cardWidth}
                                                        card={itm}
                                                        colourise={this.props.colourise} />
                                                </Grid>
                                            )
                                        }
                                        else {
                                            return null
                                        }
                                    })}
                                </Box>
                            </Grid>
                        </Grid>
                        {this.state.timeboxes.map((timebox, idx) => {
                            //if (items.length === 21) debugger;
                            return (
                                <Grid xs key={idx} >
                                    <Grid container>
                                        <Grid sx={{ width: "100%" }}>
                                            <Paper square elevation={4} sx={{ margin: "3px", textAlign: "center" }}>
                                                <Typography variant="body2">{timebox.label}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Box sx={{ margin: "3px" }}>
                                            {items.map((itm, idx) => {
                                                var inThis = filter(itm.planningIncrements, (incr) => (incr.id === timebox.id))
                                                if (inThis && inThis.length) {
                                                    return (
                                                        <Grid key={itm.id + idx}>
                                                            <PlanItem
                                                                onClick={this.nodeClicked}
                                                                width={this.cardWidth}
                                                                card={itm}
                                                                colourise={this.props.colourise} />
                                                        </Grid>
                                                    )
                                                }
                                                else {
                                                    return null
                                                }
                                            })}
                                        </Box>
                                    </Grid>
                                </Grid>
                            )
                        })}
                    </>
                </Grid>
                <Grid container colums={this.state.timeboxes.length + extraColumns}>
                    <>
                    </>
                </Grid>
            </>
        )

    }
}