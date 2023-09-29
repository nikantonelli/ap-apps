import { Cancel, CheckCircle } from "@mui/icons-material";
import { Grid, Paper, Tooltip } from "@mui/material";
import React from "react"

/**
 * We rely on the parent to keep the 'state'
 */

export class APBlocked extends React.Component {

	constructor(props) {
		super(props);

	}

	updated = () => {
		if (this.props.updated) {
			this.props.updated(!this.props.status.isBlocked)
		}
	}
	render() {
		return (
			<Grid container sx={{ alignItems: 'center' }} direction="column" onClick={this.props.readOnly?null:this.updated} >
				<Grid item>
					<Tooltip title={Boolean(this.props.status.reason) ? this.props.status.reason : (this.props.status.isBlocked ? "Blocked" : "Not Blocked")}>
						{this.props.status.isBlocked ?
							<Cancel color="error" sx={{ fontSize: "28px" }} className="options-button-icon" aria-label="blocked" /> :
							<CheckCircle color="success" sx={{ fontSize: "28px" }} className="options-button-icon" aria-label="blocked" />
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
