import { Grid, Paper, Typography } from "@mui/material";
import React from "react";
import { Editor } from "../Editor/Editor";
import { titleFieldStyle, titlePaperStyle } from "../../styles/globals";

export class APdescription extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<Grid>
				<Paper elevation={0}  sx={titlePaperStyle}>
					<Typography variant={this.props.headerType} sx={titleFieldStyle}>Description</Typography>
				</Paper>
				<Editor
					readOnly={this.props.readOnly}
					onChange={this.props.onChange}
					value={this.props.description || ""}
					type='description'
					label="Description"
				/>
			</Grid>
		)
	}
}
