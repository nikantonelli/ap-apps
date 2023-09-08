import { OpenInNew } from "@mui/icons-material";
import { Card, CardActions, CardContent, CardHeader, Grid, IconButton, Switch, Tooltip, Typography } from "@mui/material";
import React from "react";

/**
 * props:
 * 	selected		- initial selected state
 * 	selectChange 	- callback when selection changes
 */
export default class PlanItem extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			selected: Boolean(props.selected)
		}
	}

	selectChange = (evt) => {
		if (this.props.selectChange) this.props.selectChange(this.props.card.id, evt.target.checked)
	}

	openInNew = () => {
		document.open("/api/redirect/card/" + this.props.card.id, "", "noopener=true")
	}

	render() {
		const label = { inputProps: { 'aria-label': 'Include in Plan Switch' } };
		return (
			<Card sx={{ minWidth: 200, maxWidth: 400, opacity: this.props.selected ? 1 : 0.3 }}>
				<CardHeader sx={{ backgroundColor: this.props.card.color }} subheader=
					{(this.props.card.customId && this.props.card.customId.value && this.props.card.customId.value.length) ?
						this.props.card.customId.value
						: null}>

				</CardHeader>
				<CardContent sx={{ background: "lightgrey" }}>
					<Grid container>
						<Grid item xs>
							<Typography sx={{ fontSize: 14 }} colour="text.secondary" gutterBottom>
								{this.props.card.title}
							</Typography>
						</Grid>
						<Grid item xs={1}>
							<Tooltip title="Open Card in AgilePlace">
								<IconButton
									size="small"
									onClick={this.openInNew}
								>
									<OpenInNew />
								</IconButton>
							</Tooltip>
						</Grid>
					</Grid>
				</CardContent>
				<CardActions sx={{ backgroundColor: this.props.card.color }} >
					<Grid container direction={'row'} alignItems={"center"}>
						<Grid item>
							<Typography>In Scope:</Typography>
						</Grid>
						<Grid item >
							{this.props.showSelector ? <Switch
								{...label}
								checked={this.props.selected}
								onClick={this.selectChange}
							/> : null}
						</Grid>
					</Grid>
				</CardActions>
			</Card>
		)
	}
}