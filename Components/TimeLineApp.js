import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { Box, Tooltip, Typography } from "@mui/material";
import { scaleLinear } from 'd3';
import { DragHandle, IceSkatingOutlined, ImportContacts, SubdirectoryArrowRight } from "@mui/icons-material";
import { forEach } from "lodash";
export class TimeLineApp extends React.Component {

	constructor(props) {
		super(props);
	}

	depthOrder = (tree) => {
		var nodeArray = [];
		var me = this;
		forEach(tree.children, function (child) {
			nodeArray.push(child)
			nodeArray = _.union(nodeArray, me.depthOrder(child))
		})
		return nodeArray
	}
	render() {
		//When the start and end are correct, we assume we have been given the correct data source
		if (this.props.start && this.props.end) {
			var nodes = this.depthOrder(this.props.data)


			var dateToPosn = scaleLinear()
				.domain([this.props.start, this.props.end])
				.range([0, 100.0])

			var posnToDate = scaleLinear()
				.domain([0, 100.0])
				.range([this.props.start, this.props.end])

			var barHeight = "30px";

			var dateTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

			var tlg =
				<Box key={0} sx={{ width: "95%" }}>
					<Grid container direction='row'>
						<Grid sx={{ width: "20%", maxWidth: 400 }}>

						</Grid>
						<Grid sx={{ margin: "2px 0px 0px 0px", width: "80%" }}>
							<Grid id="timelineRow" container direction='row'>
								{dateTicks.map((width, idx) => {
									return <Grid key={idx} sx={{ width: "10%" }}>
										<Box sx={{ height: barHeight, width: '100%' }}>
											<Typography sx={{ fontSize: "8px" }}>
												{new Date(posnToDate(width)).toLocaleDateString("en-GB")}
											</Typography>
											<Box sx={{ height: "50%", width: "1px", backgroundColor: "black" }} />
										</Box>
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
					boxList.push(<Grid  key={i} >
						<DragHandle sx={{ opacity: 0 }} />
					</Grid>)
				}
				if (depth > 1) {
					boxList.push(<Grid  key={i}>
						<SubdirectoryArrowRight sx={{ opacity: 0 }} />
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

				var colourBar = "#27a444"
				if (plannedStartPC !== undefined) {

					if (plannedStartPC < 0) plannedStartPC = 0;
					if (plannedStartPC > 100) plannedStartPC = 100;
				}
				if (plannedEndPC !== undefined) {

					if (plannedEndPC < 0) plannedEndPC = 0;
					if (plannedEndPC > 100) plannedEndPC = 100;
				}
				if (actualStartPC !== undefined) {

					if (actualStartPC < 0) actualStartPC = 0;
					if (actualStartPC > 100) actualStartPC = 100;
				}
				if (actualEndPC !== undefined) {
					colourBar = "#444444";
					if (actualEndPC < 0) actualEndPC = 0;
					if (actualEndPC > 100) actualEndPC = 100;
				} else {
					actualEndPC = nowPosn;
				}

				return (
					<Box key={idx + 1} sx={{ width: "95%" }}>
						<Grid container direction='row'>
							<Grid container sx={{ borderTop: "3px double #aaaaaa", width: "20%", maxWidth: 400, height: barHeight }}>
								{
									treeSymbols(node.depth)
								}
								<Grid xs>
									<Tooltip title={node.data.title}>
										<Typography key={idx} variant="body2" className="timeline-text" sx={{ textAlign: "left", cursor: 'pointer' }} onClick={this.props.onClick}>
											{node.data.title}
										</Typography>
									</Tooltip>
								</Grid>

							</Grid>
							<Grid sx={{ borderTop: "3px double #aaaaaa", width: "80%", height: barHeight }}>
								{((plannedStartPC !== undefined) && (plannedEndPC !== undefined)) ?
									<Grid id="timelineRow" container direction='row'>
										<Grid sx={{ width: plannedStartPC.toString() + "%" }}>
											<Box sx={{ height: "100%", backgroundColor: 'lightgrey' }} />
										</Grid>
										<Grid sx={{ width: (plannedEndPC - plannedStartPC).toString() + "%" }}>
											<Box sx={{ borderBottom: "solid 4px #4989e4", height: "8px", backgroundColor: this.props.colourise(node) }} />
										</Grid>
										<Grid sx={{ width: (100.0 - plannedEndPC).toString() + "%" }}>
											<Box sx={{ height: "100%", backgroundColor: 'lightgrey' }} />
										</Grid>
									</Grid>
									:

									<Grid sx={{ width: "100%" }}>
										<Box sx={{ height: "12px", backgroundColor: 'lightgrey' }} />
									</Grid>
								}

								{((actualEndPC !== undefined) && (actualStartPC !== undefined)) ?
									<Grid id="timelineRow" container direction='row'>
										<Grid sx={{ width: actualStartPC.toString() + "%" }}>
											<Box sx={{ height: "100%", backgroundColor: 'lightgrey' }} />
										</Grid>
										<Grid sx={{ width: (actualEndPC - actualStartPC).toString() + "%" }}>
											<Box sx={{ borderBottom: "solid 4px " + colourBar, height: "8px", backgroundColor: this.props.colourise(node) }} />
										</Grid>
										<Grid sx={{ width: (100.0 - actualEndPC).toString() + "%" }}>
											<Box sx={{ height: "100%", backgroundColor: 'lightgrey' }} />
										</Grid>
									</Grid>
									:
									<Grid sx={{ width: "100%" }}>
										<Box sx={{ height: "12px", backgroundColor: 'lightgrey' }} />
									</Grid>}
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