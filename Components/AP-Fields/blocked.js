import { Cancel, CheckCircle } from "@mui/icons-material";
import { Grid, Paper, Tooltip } from "@mui/material";
import React from "react"

export class APBlocked extends React.Component {

	constructor(props) {
		super(props);

	}

	render() {
		return (
			<Grid container sx={{ alignItems: 'center' }} direction="column">
				<Grid item>
					<Tooltip title={Boolean(this.props.status.reason) ? this.props.status.reason : (this.props.status.isBlocked ? "Blocked" : "Not Blocked")}>
						{this.props.status.isBlocked ?
							<Cancel color="error" sx={{ fontSize: "28px" }} className="options-button-icon" aria-label="blocked" onClick={this.props.toggleBlocked} /> :
							<CheckCircle color="success" sx={{ fontSize: "28px" }} className="options-button-icon" aria-label="blocked" onClick={this.props.toggleBlocked} />
						}
					</Tooltip>
				</Grid>
				<Grid item>
					<Paper elevation={0}>{this.props.status.isBlocked ? "Blocked" : "Not Blocked"}</Paper>
				</Grid>
			</Grid>
		)
	}
}
