import { Chip, Grid, Paper } from "@mui/material";
import React from "react";

export class APPriority extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<Grid container sx={{ alignItems: 'center' }} direction="column">
				<Grid item>
					<Chip color={
						this.props.priority === "critical" ? "error" :
							(this.props.priority === "high") ? "warning" :
								(this.props.priority === "normal") ? "success" :
									"default"
					}
						label={Boolean(this.props.priority) ? this.props.priority : " -- "} />
				</Grid>
				<Grid item>
					<Paper elevation={0}>Priority</Paper>
				</Grid>
			</Grid>
		)
	}
}
