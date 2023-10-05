import { Box, Paper, Tooltip, Typography, styled } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { filter, groupBy, sortBy, unionBy } from "lodash";
import React from "react";
import { VIEW_TYPES, flattenChildren, getTitle } from "../Utils/Client/Sdk";
import { HierarchyApp } from "./HierarchyApp";
import PlanItem from "../Components/PlanningItem";

export class APAllocationView extends HierarchyApp {

    constructor(props) {
        super(props);

        this.state = {
            ...this.state,
            popoverId: null,
            popoverEl: null,
            view: VIEW_TYPES.ALLOCATION,
            timeboxes: [],
            update: 0
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
    }

    popoverOpen = (evt) => {
        this.setState({ popoverEl: evt.currentTarget, popoverId: evt.currentTarget.id });
    }

    popoverClose = (evt) => {
        this.setState({ popoverEl: null, popoverId: null });
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (prevProps != this.props) {
            this.setup()
            this.forceUpdate()  //Call render directly
        }
    }

    thisClicked = (evt) => {
        evt.shiftKey = false    //Do not allow shiftkey functionality here
        evt.ctrlKey = false    //Do not allow ctrlKey functionality here
        if (this.nodeClicked) this.nodeClicked(evt);
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
        return items;
    }

    render() {

        var items = this.calcData()
        var extraColumns = 2

        const Item = styled(Paper)(() => ({
            textAlign: 'center',
            elevation: 4,
            margin: "3px"
        }))

        return (

            <Grid container columns={this.state.timeboxes.length + extraColumns}>
                <Grid xs id="allocated">
                    <Grid container direction="column" >
                        <Item>
                            Plan Items
                        </Item>
                        <Grid container>
                            {this.props.cards.map((itm, idx) => {
                                return (
                                    <Grid key={itm.id + idx}>
                                        <PlanItem
                                            onClick={this.thisClicked}
                                            card={itm}
                                            colourise={this.props.colourise} />
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Grid>
                </Grid>
                <Grid xs id="unallocated">
                    <Grid container direction="column" >
                        <Item>
                            Unallocated
                        </Item>
                        <Grid container className="sprint-container">
                            {items.map((itm, idx) => {
                                if (!Boolean(itm.planningIncrements) || (itm.planningIncrements.length === 0)) {
                                    return (
                                        <Grid id={"pi_" + itm.id} key={itm.id}>
                                            <Tooltip title={getTitle(itm, this.props.sort, this.props.colouring)}>
                                                <div >
                                                    <PlanItem
                                                        onClick={this.thisClicked}
                                                        card={itm}
                                                        colourise={this.props.colourise} />
                                                </div>
                                            </Tooltip>
                                        </Grid>
                                    )
                                }
                                else {
                                    return null
                                }
                            })}
                        </Grid>
                    </Grid>
                </Grid>
                {this.state.timeboxes.map((timebox, idx) => {
                    return (
                        <Grid key={timebox.id} xs>
                            <Item>
                                {timebox.label}
                            </Item>
                        </Grid>
                    )
                })}

                {/* <Grid xs id="unallocated">
                        <Grid container sx={{ alignContents: "center" }}>
                            <Grid className="sprint-column">
                                <Paper square elevation={4} sx={{ margin: "3px", textAlign: "center" }}>
                                    <Typography sx={{ width: "100%" }} variant="body2">Unallocated</Typography>
                                </Paper>
                            </Grid>

                            <Box className="sprint-column">
                                <Grid container className="sprint-container">
                                    {items.map((itm, idx) => {
                                        if (!Boolean(itm.planningIncrements) || (itm.planningIncrements.length === 0)) {
                                            return (
                                                <Grid id={"pi_" + itm.id} key={itm.id}>
                                                    <Tooltip title={getTitle(itm, this.props.sort, this.props.colouring)}>
                                                        <div >
                                                            <PlanItem
                                                                onClick={this.thisClicked}
                                                                card={itm}
                                                                colourise={this.props.colourise} />
                                                        </div>
                                                    </Tooltip>
                                                </Grid>
                                            )
                                        }
                                        else {
                                            return null
                                        }
                                    })}
                                </Grid>
                            </Box>
                        </Grid>
                    </Grid>
                    {this.state.timeboxes.map((timebox, idx) => {
                        //if (items.length === 21) debugger;
                        return (
                            <Grid xs key={idx} >
                                <Grid container className="sprint-column">
                                    <Grid>
                                        <Paper square elevation={4} sx={{ margin: "3px", textAlign: "center" }}>
                                            <Typography variant="body2">{timebox.label}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Box className="sprint-column">
                                        <Grid container>
                                            {items.map((itm, idx) => {
                                                var inThis = filter(itm.planningIncrements, (incr) => (incr.id === timebox.id))
                                                if (inThis && inThis.length) {
                                                    return (
                                                        <Grid key={itm.id + idx}>
                                                            <Tooltip title={getTitle(itm, this.props.sort, this.props.colouring)}>
                                                                <div>
                                                                    <PlanItem
                                                                        onClick={this.thisClicked}
                                                                        card={itm}
                                                                        colourise={this.props.colourise} />
                                                                </div>
                                                            </Tooltip>
                                                        </Grid>
                                                    )
                                                }
                                                else {
                                                    return null
                                                }
                                            })}
                                        </Grid>
                                    </Box>
                                </Grid>
                            </Grid>
                        )
                    })}*/}
            </Grid>

        )

    }
}