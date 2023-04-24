import CardService from "@/services/CardService";
import { DataProvider } from "@/utils/DataProvider";
import { CancelPresentation, Delete, DeleteForever, ExpandMore, Logout, SaveAltOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Card, CardActions, CardContent, CardHeader, Grid, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import React from "react";

export default class Item extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			data : props.card,
			detailsSection:	 true,
			connectionsSection: false,
			peopleSection: false
		}
	}

	handleBlock = () => {
		var data = this.state.data;
		data.blocked = !data.blocked;
		this.setChanged(data);
	}

	updateDescription = (e) => {
		if (this.isChanged !== true) {
			return;
		}
		var data = this.state.data;
		this.setChanged(data);
	}

	updateTitle = (e) => {
		if (this.isChanged !== true) {
			return;
		}
		var data = this.state.data;
		this.setChanged(data);
	}

	setChanged = (data) => {
		if (!this.isChanged) {
			this.savedData = this.state.data;
		}
		this.setState({ data: data });
		this.isChanged = true;
	}

	descriptionChanged = (e) => {
		var data = this.state.data;
		data.description = e.target.value;
		this.setChanged(data);
	}

	titleChanged = (e) => {
		var data = this.state.data;
		data.title = e.target.value.substr(0, 127);
		this.setChanged(data);
	}

	checkBeforeLeave = (e) => {
		if (this.isChanged) {
			SdkUtils.showError({ message: "Save/Cancel changes before leaving page" });
			e.preventDefault();
			e.returnValue = ''
		}
		window.removeEventListener('beforeunload', this.checkBeforeLeave);
	}

	cancelChanges = (e) => {
		if (this.isChanged) {
			this.isChanged = false;
			this.refresh();
		}
	}

	handleAccordionChange = (event, requestedState) => {
		var ed = {};
		ed[event.currentTarget.id] = requestedState;
		this.setState(ed);
	}

	render() {
		var me = this;
		if (this.props.card != null) {
			return (
				<Card variant='outlined' sx={{ fontSize: '14px'}} iid={this.state.data.id}>
					<CardHeader
						sx={{ height: '10px', fontSize: 'inherit', backgroundColor: this.state.data.type.cardColor }}
						title = {"ID: " + this.state.data.id} 
					/>

					<CardContent sx={{ backgroundColor: this.state.data.type.cardColor }}>
						<Accordion expanded={this.state.detailsSection} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="details-content" id="detailsSection" expandIcon={<ExpandMore />}>
								<Typography>{this.state.detailsSection ? "Details" : this.state.data.title}</Typography>
							</AccordionSummary>
							<Grid container direction="row">
								<Grid xs={3} item margin={'10px'} className='card-description-field' >
									<TextField
										variant="outlined"
										label="Title"
										className='card-description-field'
										value={this.state.data.title}
										onBlur={this.updateTitle}
										onChange={this.titleChanged}
									/>
								</Grid>
								<Grid xs={3} item margin={'10px'} className='card-description-field'>
									<TextField
										multiline
										onBlur={this.updateDescription}
										onChange={this.descriptionChanged}
										maxRows={10}
										minRows={3}
										placeholder='Click to edit Description'
										value={this.state.data.description || ""}
										className='card-description-field'
										label="Description"
										style={{
											className: 'card-description-field-input',
											fontFamily: "Arial",
											fontSize: 12
										}}
									/>
								</Grid>
								
							</Grid>
						</Accordion>
						<Accordion expanded={this.state.connectionsSection} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="connections-content" id="connectionsSection" expandIcon={<ExpandMore />}>
								<Typography>Connections</Typography>
							</AccordionSummary>
							<AccordionDetails>

							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state.peopleSection} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="people-content" id="peopleSection" expandIcon={<ExpandMore />}>
								<Typography>People</Typography>
							</AccordionSummary>
							<AccordionDetails>
								Text
							</AccordionDetails>
						</Accordion>
					</CardContent>
					<CardActions style={{ justifyContent: 'center' }} >
						<Tooltip title="Save Changes">
							<IconButton
								sx={{ fontSize: '28px' }}
								aria-label='save card'
								onClick={this.checkUpdates}
								color={this.isChanged ? 'error' : 'default'}
							>
								<SaveAltOutlined />
							</IconButton>
						</Tooltip> <Tooltip title={this.isChanged ? "Save and Close" : "Close"}>
							<IconButton
								sx={{ fontSize: '28px' }}
								aria-label='save if needed, and close'
								onClick={this.updateDataClose}
								color={this.isChanged ? 'error' : 'default'}
							>
								<Logout />
							</IconButton>
						</Tooltip>

						<Tooltip title="Cancel Changes">
							<IconButton sx={{ fontSize: '28px' }} aria-label='cancel changes' onClick={this.cancelChanges}>
								<CancelPresentation />
							</IconButton>
						</Tooltip>

						<Tooltip title="Send to Recycle Bin">
							<IconButton sx={{ fontSize: '28px' }} aria-label="send to recycle bin" onClick={this.deleteRecycle}>
								<Delete />
							</IconButton>
						</Tooltip>

						<Tooltip title="Delete Forever">
							<IconButton sx={{ fontSize: '28px' }} aria-label="delete forever" onClick={this.deleteForever} >
								<DeleteForever />
							</IconButton>
						</Tooltip>
					</CardActions>

				</Card>
			)
		} else {
			return <div />
		}
	}
}


export async function getServerSideProps({ req, params, query }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = DataProvider.get()
	}
	var cs = new CardService(req.headers.host);
	var card = await cs.get(params.id)
	if (card) {

		return { props: { card: card, host: req.headers.host } }
	}
	return { props: { card: null, host: req.headers.host } }
}