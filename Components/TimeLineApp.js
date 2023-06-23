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

			var barHeight = "30px";

			var tlg = nodes.map((node, idx) => {
				var startPercent = node.data.plannedStart?dateToSize(new Date(node.data.plannedStart).getTime()):0
				var endPercent = node.data.plannedFinish?dateToSize(new Date(node.data.plannedFinish).getTime()):0
				
				return (
					<Box sx={{ width: "100%" }}>
						<Grid container direction='row'>
							<Grid sx={{ width: "20%", maxWidth: 400 }}>
								<Box sx={{ height: barHeight }}>
									<Tooltip title={node.data.title}>
										<Typography key={idx} className="timeline-text" sx={{cursor:'pointer'}} onClick={this.props.onClick}>
											{node.data.title}
										</Typography>
									</Tooltip>
								</Box>
							</Grid>
							<Grid sx={{ margin: "2px 0px 0px 0px", width: "80%" }}>
								<Grid id="timelineRow" container direction='row'>
									<Grid sx={{ width: startPercent.toFixed(1).toString()+"%"}}>
										<Box sx={{ borderRadius: "5px", height: barHeight, width: '100%', backgroundColor: 'lightgrey' }} />
									</Grid>
									<Grid sx={{ width: (endPercent - startPercent).toFixed(1).toString()+"%"}}>
										<Box sx={{  borderRadius: "5px", height: barHeight, width: '100%', backgroundColor: 'blue' }} />
									</Grid>
									<Grid sx={{ width: (100.0 - endPercent).toFixed(1).toString()+"%"}}>
										<Box sx={{  borderRadius: "5px", height: barHeight, width: '100%', backgroundColor: 'lightgrey' }} />
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
				</>
			)
		} else {
			return null;
		}
	}
}