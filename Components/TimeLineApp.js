import { DragHandle, SubdirectoryArrowRight } from "@mui/icons-material";
import { Box, Popover, Tooltip, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { scaleLinear } from 'd3';
import { forEach, sortBy } from "lodash";
import React from "react";
import { VIEW_TYPES, flattenChildren } from "../utils/Client/Sdk";
import APBoard from "./APBoard";
import { getLabel, getTitle } from "../utils/Client/SdkSvg";

export class APTimeLineView extends React.Component {

	constructor(props) {
		super(props);
		this.mode = VIEW_TYPES.TIMELINE
		
		this.state = {
			popoverId: null,
			popoverEl: null
		}
		this.errorData = props.errorData || this.nullErrorData

	}

	nullErrorData = () => {
		return {
			msg: "",
			colour: "#ff0000"
		}
	}

	depthOrder = (tree) => {
		var nodeArray = []
		flattenChildren(tree, nodeArray)
		return nodeArray
	}

	typeOrder = (tree) => {
		var nodeArray = []
		flattenChildren(tree, nodeArray)
		return sortBy(nodeArray,[function(c) { return c.data.type.title}])
	}

	contextOrder = (tree) => {
		var nodeArray = []
		flattenChildren(tree, nodeArray)
		return sortBy(nodeArray,[function(c) { return c.data.board.title}])
	}
	
	popoverOpen = (evt) => {
		this.setState({ popoverEl: evt.currentTarget, popoverId: evt.currentTarget.id });
	}

	popoverClose = (evt) => {
		this.setState({ popoverEl: null, popoverId: null });
	}

	render() {
		var me = this;
		this.colouring = this.props.colouring
		this.sort = this.props.sort
		//When the start and end are correct, we assume we have been given the correct data source
		if (this.props.start && this.props.end) {

			var nodes = []
			switch (this.props.grouping) {
				default:
				case 'level': {
					nodes = this.depthOrder(this.props.root.children)
					break;
				}
				case 'context': {
					nodes = this.contextOrder(this.props.root.children)
					this.colouring = this.props.grouping
					break;
				}
				case 'type': {
					nodes = this.typeOrder(this.props.root.children)
					this.colouring = this.props.grouping
					break;
				}
			}


			var dateToPosn = scaleLinear()
				.domain([this.props.start, this.props.end])
				.range([0, 100.0])

			var posnToDate = scaleLinear()
				.domain([0, 100.0])
				.range([this.props.start, this.props.end])

			var barHeight = "30px";

			var dateTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

			var tlg =
				<Box key={0} sx={{ width: "100%" }}>
					<Grid container direction='row'>
						<Grid sx={{ width: "20%", maxWidth: 400 }}>

						</Grid>
						<Grid sx={{ margin: "2px 0px 0px 0px", width: "80%" }}>
							<Grid id="timelineRow" container direction='row'>
								{dateTicks.map((width, idx) => {
									return <Grid key={idx} sx={{ width: "10%" }}>

										<Typography sx={{ textAlign: 'left', fontSize: "10px" }}>
											{new Date(posnToDate(width)).toLocaleDateString("en-GB")}
										</Typography>
										<Box sx={{ height: "50%", width: "1px", backgroundColor: "black" }} />

									</Grid>
								})
								}
							</Grid>
						</Grid>
					</Grid>
				</Box>

			function treeSymbols(depth) {
				var boxList = []

				for (var i = 2; i < depth; i++) {
					boxList.push(<Grid key={i} >
						<DragHandle sx={{ opacity: 0 }} />
					</Grid>)
				}
				if (depth > 1) {
					boxList.push(<Grid key={i}>
						<SubdirectoryArrowRight sx={{ opacity: 0.2 }} />
					</Grid>)
				}
				return boxList;
			}

			var blg = nodes.map((node, idx) => {
				//dateToPosn returns undefined if date is outside the range
				var plannedStartPC = node.data.plannedStart ? dateToPosn(new Date(node.data.plannedStart).getTime()) : undefined
				var plannedEndPC = node.data.plannedFinish ? dateToPosn(new Date(node.data.plannedFinish).getTime()) : undefined

				var actualStartPC = node.data.actualStart ? dateToPosn(new Date(node.data.actualStart).getTime()) : undefined
				var actualEndPC = node.data.actualFinish ? dateToPosn(new Date(node.data.actualFinish).getTime()) : undefined

				var nowPosn = dateToPosn(Date.now())

				var planBar = "#27a444"
				var actualBar = "#ce7d05"
				if (plannedStartPC !== undefined) {

					if (plannedStartPC < 0) plannedStartPC = 0;
					if (plannedStartPC > 100) plannedStartPC = 100;
				}
				else plannedStartPC = 0;
				if (plannedEndPC !== undefined) {

					if (plannedEndPC < 0) plannedEndPC = 0;
					if (plannedEndPC > 100) plannedEndPC = 100;
				}
				else plannedEndPC = 0;
				if (actualStartPC !== undefined) {

					if (actualStartPC < 0) actualStartPC = 0;
					if (actualStartPC > 100) actualStartPC = 100;
				}
				else actualStartPC = 0;
				if (actualEndPC !== undefined) {
					planBar = "#444444";
					actualBar = planBar
					if (actualEndPC < 0) actualEndPC = 0;
					if (actualEndPC > 100) actualEndPC = 100;
				} else {
					actualEndPC = nowPosn;
				}
				var bCol = this.props.colourise(node);
				var eColour = this.errorData(node).colour;
				return (
					<Box key={idx + 1} sx={{ width: "100%" }}>
						<Grid container direction='row'>
							<Grid container sx={
								eColour.length ?
									{ borderTop: "3px solid " + eColour, width: "20%", maxWidth: 400, height: barHeight }:
									{ paddingTop: "3px", width: "20%", maxWidth: 400, height: barHeight }
								}>
								{
									this.props.grouping === 'level' ? treeSymbols(node.depth): null
								}
								<Grid xs onClick={this.props.onClick}>

									<Typography variant="subtitle2"
										key={idx}
										id={node.data.id}
										className="timeline-text"
										sx={{ height: "24px", backgroundColor: bCol, textAlign: "left", cursor: 'pointer', opacity: APBoard.OPACITY_MEDIUM }}
										onClick={this.props.onClick}
										onMouseEnter={this.popoverOpen}
										onMouseLeave={this.popoverClose}
									>
										{getLabel(me, node)}
									</Typography>
									<Popover
										sx={{
											pointerEvents: 'none'
										}}
										anchorEl={this.state.popoverEl}
										anchorOrigin={{
											vertical: 'top',
											horizontal: 'right'
										}}
										transformOrigin={{
											vertical: 'bottom',
											horizontal: 'left'
										}}
										open={this.state.popoverId === node.data.id}
										onClose={this.popoverClose}
										disableRestoreFocus>
										<Typography sx={{height:"30px"}} align='center' variant="subtitle2">{getTitle(me, node)}</Typography>
									</Popover>

								</Grid>

							</Grid>
							<Grid sx={{ paddingTop: "3px", width: "80%", height: barHeight }}>

								<Grid id="timelineRow" container direction='row'>
									<Grid sx={{ width: plannedStartPC.toString() + "%" }}>
										<Box sx={{ height: "100%", backgroundColor: 'lightgrey' }} />
									</Grid>
									<Grid sx={{ width: (plannedEndPC - plannedStartPC).toString() + "%" }}>
										<Box sx={{ height: "12px", backgroundColor: planBar }} />
									</Grid>
									<Grid sx={{ width: (100.0 - plannedEndPC).toString() + "%" }}>
										<Box sx={{ height: "100%", backgroundColor: 'lightgrey' }} />
									</Grid>
								</Grid>

								<Grid id="timelineRow" container direction='row'>
									<Grid sx={{ width: actualStartPC.toString() + "%" }}>
										<Box sx={{ height: "100%", backgroundColor: 'lightgrey' }} />
									</Grid>
									<Grid sx={{ width: (actualEndPC - actualStartPC).toString() + "%" }}>
										<Box sx={{ height: "12px", backgroundColor: actualBar }} />
									</Grid>
									<Grid sx={{ width: (100.0 - actualEndPC).toString() + "%" }}>
										<Box sx={{ height: "100%", backgroundColor: 'lightgrey' }} />
									</Grid>
								</Grid>
							</Grid>
						</Grid>
					</Box>
				)
			})
			return (
				<>
					{tlg}
					{blg}
				</>
			)
		} else {
			return null;
		}
	}
}