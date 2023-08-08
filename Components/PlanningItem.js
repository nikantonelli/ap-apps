import { CheckBox } from "@mui/icons-material";
import { Button, Card, CardActions, CardContent, CardHeader, IconButton, Switch, Typography } from "@mui/material";
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
			<Card sx={{ minWidth: 200, maxWidth: 400 }}>
				<CardActions>
					<Switch
						{...label}
						checked={this.props.selected}
						onClick={this.selectChange}
					/>
				</CardActions>
				<CardHeader>
					{(this.props.card.customId && this.props.card.customId.value && this.props.card.customId.value.length) ?
						<Typography sx={{ fontSize: 14 }} colour="text.secondary" gutterBottom>
							{this.props.card.customId.value}
						</Typography>
						: null}
				</CardHeader>
				<CardContent sx={{ background: "lightgrey", opacity: this.props.selected ? 1 : 0.3 }}>
					<Typography sx={{ fontSize: 14 }} colour="text.secondary" gutterBottom>
						{this.props.card.title}
					</Typography>
				</CardContent>
				<CardActions>
					<Button
						size="small"
						onClick={this.openInNew}
					>
						Open In New Tab
					</Button>
				</CardActions>
			</Card>
		)
	}
}