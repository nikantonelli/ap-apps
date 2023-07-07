import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { Box, Tooltip, Typography } from "@mui/material";
import { scaleLinear } from 'd3';
export class TimeLineApp extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		//When the start and end are correct, we assume we have been given the correct data source
		if (this.props.start && this.props.end) {
			var nodes = this.props.data


			var dateToSize = scaleLinear()
				.domain([this.props.start, this.props.end])
				.range([0, 100])

				var sizeToDate = scaleLinear()
				.domain([0, 100])
				.range([this.props.start, this.props.end])

			var barHeight = "30px";

			var dateTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

			var tlg = <Box key={0} sx={{ width: "100%" }}>
				<Grid container direction='row'>
					<Grid sx={{ width: "20%", maxWidth: 400 }}>
						<Grid container direction="row">
						<Box sx={{ height: barHeight }}>
								<Typography sx={{ textAlign: "left", cursor: 'pointer' }}>
									Item Title
								</Typography>
						</Box>
						<Box sx={{ height: barHeight }}>
								<Typography sx={{ textAlign: "right", cursor: 'pointer' }}>
									Date:
								</Typography>
						</Box>
						</Grid>
					</Grid>
					<Grid sx={{ margin: "2px 0px 0px 0px", width: "80%" }}>
						<Grid id="timelineRow" container direction='row'>
							{dateTicks.map((width, idx) => {
								return <Grid sx={{ width: "10%" }}>
									<Box sx={{ height: barHeight, width: '100%'}}>
										<Typography sx={{fontSize:"8px"}}>
											{new Date(sizeToDate(width)).toDateString()}
										</Typography>
										<Box sx={{ height:"50%", width: "1px", backgroundColor: "black"}} />
									</Box>
								</Grid>
							})
							}
						</Grid>
					</Grid>
				</Grid>
			</Box>


			var blg = nodes.map((node, idx) => {
				var startPercent = node.data.plannedStart ? dateToSize(new Date(node.data.plannedStart).getTime()) : 0
				var endPercent = node.data.plannedFinish ? dateToSize(new Date(node.data.plannedFinish).getTime()) : 0

				return (
					<Box key={idx+1} sx={{ width: "100%" }}>
						<Grid container direction='row'>
							<Grid sx={{ width: "20%", maxWidth: 400 }}>
								<Box sx={{ height: barHeight }}>
									<Tooltip title={node.data.title}>
										<Typography key={idx} variant="body2" className="timeline-text" sx={{ textAlign: "center", cursor: 'pointer' }} onClick={this.props.onClick}>
											{node.data.title}
										</Typography>
									</Tooltip>
								</Box>
							</Grid>
							<Grid sx={{ margin: "2px 0px 0px 0px", width: "80%" }}>
								<Grid id="timelineRow" container direction='row'>
									<Grid sx={{ width: startPercent.toFixed(1).toString() + "%" }}>
										<Box sx={{ zIndex: 999, borderRadius: "5px", height: barHeight, width: '100%', backgroundColor: 'lightgrey' }} />
									</Grid>
									<Grid sx={{ width: (endPercent - startPercent).toFixed(1).toString() + "%" }}>
										<Box sx={{ margin: "0px 1px 0px 0px", border: "solid 1px black", borderRadius: "5px", height: barHeight, width: '100%', backgroundColor: this.props.colourise(node) }} />
									</Grid>
									<Grid sx={{ width: (100.0 - endPercent).toFixed(1).toString() + "%" }}>
										<Box sx={{ zIndex: 999, borderRadius: "5px", height: barHeight, width: '100%', backgroundColor: 'lightgrey' }} />
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