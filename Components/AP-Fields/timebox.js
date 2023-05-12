import { Chip, Grid, Paper } from "@mui/material";
import React from "react";

export class APtimebox extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<Grid container sx={{ alignItems: 'center' }} direction="column">
				<Grid item>
					<Chip label={Boolean(this.props.size) ? this.props.size : " -- "} />
				</Grid>
				<Grid item>
					<Paper elevation={0}>{Boolean(this.props.size) ?
						((this.props.size == 1) ? "XS" :
							(this.props.size == 2) ? "S" :
								(this.props.size == 3) ? "M" :
									(this.props.size < 6) ? "L" :
										(this.props.size < 9) ? "XL" : "XXL")
						: "Not Sized"}</Paper>
				</Grid>
			</Grid>
		)
	}
}
