import { Switch, Tooltip, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import React from "react";
import { getSvgTitle } from "../Utils/Client/SdkSvg";

/**
 * props:
 * 	selected		- initial selected state
 * 	selectChange 	- callback when selection changes
 */
export default class PlanItem extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			selected: Boolean(props.selected),
			flag: false
		}
		this.setup()
	}

	setup = () => {
		this.width = this.props.width || 200;
		this.colourise = this.props.colourise || function () { return "#cccccc" }
	}

	componentDidUpdate = (prevProps, prevState) => {
		if (prevProps != this.props) {
			this.setup()
			this.setState({ flag: !prevProps.flag })
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
			// <Card sx={{ minWidth: 200, maxWidth: 400, opacity: this.props.selected ? 1 : 0.3 }}>
			// 	<CardHeader sx={{ backgroundColor: this.props.card.color }} subheader=
			// 		{(this.props.card.customId && this.props.card.customId.value && this.props.card.customId.value.length) ?
			// 			this.props.card.customId.value
			// 			: null}>

			// 	</CardHeader>
			// 	<CardContent sx={{ background: "lightgrey" }}>
			// 		<Grid container>
			// 			<Grid item xs>
			// 				<Typography sx={{ fontSize: 14 }} colour="text.secondary" gutterBottom>
			// 					{this.props.card.title}
			// 				</Typography>
			// 			</Grid>
			// 			<Grid item xs={1}>
			// 				<Tooltip title="Open Card in AgilePlace">
			// 					<IconButton
			// 						size="small"
			// 						onClick={this.openInNew}
			// 					>
			// 						<OpenInNew />
			// 					</IconButton>
			// 				</Tooltip>
			// 			</Grid>
			// 		</Grid>
			// 	</CardContent>
			// 	{this.selectChange ?
			// 	<CardActions sx={{ backgroundColor: this.props.card.color }} >
			// 		<Grid container direction={'row'} alignItems={"center"}>
			// 			<Grid item>
			// 				<Typography>In Scope:</Typography>
			// 			</Grid>
			// 			<Grid item >
			// 				{this.props.showSelector ? <Switch
			// 					{...label}
			// 					checked={this.props.selected}
			// 					onClick={this.selectChange}
			// 				/> : null}
			// 			</Grid>
			// 		</Grid>
			// 	</CardActions>
			// 	:null}
			// </Card>
			<Grid
				container
				spacing={1}
				sx={{ margin: "2px 2px 0px 0px", width: this.width, backgroundColor: this.colourise({ data: this.props.card }) }}
				onClick={this.props.onClick}
			>
				<Grid direction="column">
					<Grid xs="auto">
						<>
							{(this.props.card.customId && this.props.card.customId.value && this.props.card.customId.value.length) ?

								<Typography variant="body2">
									{this.props.card.customId.value}
								</Typography>
								: null}
							<Typography variant="body2">
								{this.props.card.title}
							</Typography>
						</>
					</Grid>
					<Grid xs>
						<Grid container direction={'row'} alignItems={"center"}>
							{this.props.showSelector ?
								<>
									<Grid >
										<Typography variant="body2">In Scope:</Typography>
									</Grid>
									<Grid  >
										<Switch
											{...label}
											checked={this.props.selected}
											onClick={this.selectChange}
										/>
									</Grid>
								</> : null}
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		)
	}
}