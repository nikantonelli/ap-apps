import CardService from "@/services/CardService";
import { DataProvider } from "@/utils/DataProvider";
import { CalendarToday, Cancel, CancelPresentation, CheckCircle, ConnectingAirports, Delete, DeleteForever, ExpandMore, KeyboardDoubleArrowDown, KeyboardDoubleArrowUp, List, Logout, People, SaveAltOutlined, SettingsEthernet } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Card, CardActionArea, CardActions, CardContent, Chip, Grid, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import React from "react";

import { Editor } from "@/Components/Editor/Editor";
import { getCardChildren, getListOfCards, getBoard } from "@/utils/Sdk";
import { ConnectionTable } from "@/Components/ConnectionTable";
import { AssignedUserTable } from "@/Components/AssignedUserTable";
import { CardUserTable } from "@/Components/CardUserTable";

export default class Item extends React.Component {

	static CONNECTIONS_PANEL_NAME = "connectionsSection";
	static PEOPLE_PANEL_NAME = "peopleSection";
	static DETAILS_PANEL_NAME = "detailsSection";
	static SCHEDULE_PANEL_NAME = "scheduleSection"

	constructor(props) {
		super(props);
		this.state = {
			data: props.card,
			description: props.card || props.card.description,
			changed: false,
			descendants: [],
			parents: [],
			context: null,
			openAll: true,
			blocked: props.card || props.card.blockedStatus.isBlocked
		}
		this.state[Item.CONNECTIONS_PANEL_NAME] = false;
		this.state[Item.PEOPLE_PANEL_NAME] = false;
		this.state[Item.DETAILS_PANEL_NAME] = true;
		this.state[Item.SCHEDULE_PANEL_NAME] = false;

		this.savedData = props.card;
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
		var data = { ...this.state.data };
		this.setChanged(data);
	}

	updateTitle = (e) => {
		if (this.isChanged !== true) {
			return;
		}
		var data = { ...this.state.data };
		this.setChanged(data);
	}

	setChanged = (data) => {
		this.setState({ data: data });
		this.isChanged = true;

	}

	/**
	 * 
	 * @param {*} editorValue 
	 * 
	 * Description Editor is a lexical richtexteditor
	 * that needs special attention.
	 */
	descriptionChanged = (editorValue) => {
		if (!this.dscrEditorLoaded) {
			this.dscrEditorLoaded = true;
		} else {
			if (!this.dispatchDescClear) {
				var data = { ...this.state.data }
				data.description = editorValue
				this.setChanged(data)
			}
			this.dispatchDescClear = false
		}
	}

	titleChanged = (e) => {
		var data = { ...this.state.data };
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
		this.isChanged = false;
		this.setState({ data: this.savedData })
		this.dispatchDescClear = true;
		window.dispatchEvent(new Event('clear-editor-description'));
	}

	handleAccordionChange = (event, requestedState) => {
		var ed = {};
		ed[event.currentTarget.id] = requestedState;
		this.setState(ed);
	}

	componentDidMount = () => {
		var data = this.state.data;

		//Get the connection info
		getCardChildren(this.props.host, data).then(async (children) => {
			var childArray = await children.json()
			this.setState({ descendants: childArray.cards })
			if (data.parentCards && data.parentCards.length) {
				getListOfCards(this.props.host, data.parentCards.map((card) => card.cardId)).then(async (parents) => {
					var parentArray = await parents.json()
					this.setState({ parents: parentArray.cards })
				})
			}
		})

		//Get the context info
		getBoard(this.props.host, this.state.data.board.id).then(async (info) => {
			var board = await info.json()
			this.setState({ context: board })
		})
	}

	changeSection = (evt) => {
		var ed = {}
		if ((evt.currentTarget.id === "toggleAll")) {
			ed[Item.DETAILS_PANEL_NAME] = this.state.openAll;
			ed[Item.PEOPLE_PANEL_NAME] = this.state.openAll;
			ed[Item.CONNECTIONS_PANEL_NAME] = this.state.openAll;
			ed[Item.SCHEDULE_PANEL_NAME] = this.state.openAll;
			this.setState((prev) => { return { openAll: !prev.openAll, ...ed } })
		}
		else {
			ed[Item.DETAILS_PANEL_NAME] = false;
			ed[Item.PEOPLE_PANEL_NAME] = false;
			ed[Item.CONNECTIONS_PANEL_NAME] = false;
			ed[Item.SCHEDULE_PANEL_NAME] = false;
			ed[evt.currentTarget.id] = true;
			this.setState(ed)
			evt.currentTarget.scrollIntoView({ block: 'end', inline: 'nearest' })

		}
	}
	toggleBlocked = (evt) => {

		this.setState((prev) => { return { blocked: !prev.blocked } })
	}

	render() {
		var sectionHeaderType = "h5"
		var fieldHeaderType = "h6"
		if (this.props.card != null) {
			return (
				<Card sx={{ minWidth: 600 }} variant='outlined' iid={this.state.data.id}>
					<Grid style={{ backgroundColor: this.state.data.type.cardColor }} container direction="row">
						<Grid item xs={6}>
							<CardActions style={{ backgroundColor: this.state.data.type.cardColor, justifyContent: 'left' }} >
								<Tooltip title={this.state.openAll ? "Open All" : "Close All"}>
									<IconButton id="toggleAll" size='large' className="options-button-icon" aria-label='open panels' onClick={this.changeSection}>
										{this.state.openAll ? <KeyboardDoubleArrowDown /> : <KeyboardDoubleArrowUp />}
									</IconButton>
								</Tooltip>
								<Tooltip title="Details">
									<IconButton id={Item.DETAILS_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<List />
									</IconButton>
								</Tooltip>
								<Tooltip title="Schedule">
									<IconButton id={Item.SCHEDULE_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<CalendarToday />
									</IconButton>
								</Tooltip>
								<Tooltip title="Connections">
									<IconButton id={Item.CONNECTIONS_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<SettingsEthernet />
									</IconButton>
								</Tooltip>
								<Tooltip title="People">
									<IconButton id={Item.PEOPLE_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<People />
									</IconButton>
								</Tooltip>
							</CardActions>
						</Grid>
						<Grid item xs={6}>
							<CardActions style={{ backgroundColor: this.state.data.type.cardColor, justifyContent: 'right' }} >
								<Tooltip title="Save Changes">
									<IconButton
										size='large'
										className="options-button-icon"
										aria-label='save card'
										onClick={this.checkUpdates}
										color={this.isChanged ? 'error' : 'default'}
									>
										<SaveAltOutlined />
									</IconButton>
								</Tooltip>
								<Tooltip title={this.isChanged ? "Save and Close" : "Close"}>
									<IconButton
										size='large'
										className="options-button-icon"
										aria-label='save if needed, and close'
										onClick={this.updateDataClose}
										color={this.isChanged ? 'error' : 'default'}
									>
										<Logout />
									</IconButton>
								</Tooltip>
								<Tooltip title="Cancel Changes">
									<IconButton size='large' className="options-button-icon" aria-label='cancel changes' onClick={this.cancelChanges}>
										<CancelPresentation />
									</IconButton>
								</Tooltip>

								<Tooltip title="Send to Recycle Bin">
									<IconButton size='large' className="options-button-icon" aria-label="send to recycle bin" onClick={this.deleteRecycle}>
										<Delete />
									</IconButton>
								</Tooltip>

								<Tooltip title="Delete Forever">
									<IconButton size='large' className="options-button-icon" aria-label="delete forever" onClick={this.deleteForever} >
										<DeleteForever />
									</IconButton>
								</Tooltip>
							</CardActions>
						</Grid>
					</Grid>
					<CardContent sx={{ backgroundColor: this.state.data.type.cardColor }}>
						<Accordion expanded={this.state[Item.DETAILS_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="details-content" id={Item.DETAILS_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>{this.state[Item.DETAILS_PANEL_NAME] ? this.state.data.type.title + ": " + this.state.data.id : this.state.data.title}</Typography>
							</AccordionSummary>
							<Grid container direction="column" >
								<Grid item>
									<Grid container direction="row">
										<Grid item className='card-description-field' >
											<Grid>
												<Paper elevation={0} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Title</Typography></Paper>
												<TextField

													variant="outlined"
													className='card-description-field'
													value={this.state.data.title}
													onBlur={this.updateTitle}
													onChange={this.titleChanged}
												/>
											</Grid>
										</Grid>
										<Grid item className='card-description-field' >
											<Paper elevation={0} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">
												{"Status: " + ((this.state.data.lane.cardStatus === "finished") ?
													" Finished (" + this.state.data.actualFinish + ")" :
													(this.state.data.lane.cardStatus === "notStarted") ?
														" Not Started" :
														" Started (" + this.state.data.actualStart + ")"
												)}
											</Typography></Paper>
											<Grid container direction="row">
												<Grid xs={2} item>
													<Grid container sx={{ alignItems: 'center' }} direction="column">
														<Grid item>
															<Tooltip title={Boolean(this.state.data.blockedStatus.reason) ? this.state.data.blockedStatus.reason : (this.state.data.blockedStatus.isBlocked ? "Blocked" : "Not Blocked")}>
																{this.state.data.blockedStatus.isBlocked ?
																	<Cancel color="error" sx={{ fontSize: "28px" }} className="options-button-icon" aria-label="blocked" onClick={this.toggleBlocked} /> :
																	<CheckCircle color="success" sx={{ fontSize: "28px" }} className="options-button-icon" aria-label="blocked" onClick={this.toggleBlocked} />
																}
															</Tooltip>
														</Grid>
														<Grid item>
															<Paper elevation={0}>{this.state.data.blockedStatus.isBlocked ? "Blocked" : "Not Blocked"}</Paper>
														</Grid>
													</Grid>
												</Grid>
												<Grid xs={2} item>
													<Grid container sx={{ alignItems: 'center' }} direction="column">
														<Grid item>
															<Chip label={Boolean(this.state.data.size) ? this.state.data.size : " -- "} />
														</Grid>
														<Grid item>
															<Paper elevation={0}>{Boolean(this.state.data.size) ?
																((this.state.data.size == 1) ? "XS" :
																	(this.state.data.size == 2) ? "S" :
																		(this.state.data.size == 3) ? "M" :
																			(this.state.data.size < 6) ? "L" :
																				(this.state.data.size < 9) ? "XL" : "XXL")
																: "Not Sized"}</Paper>
														</Grid>
													</Grid>
												</Grid>
												<Grid xs={2} item>
													<Grid container sx={{ alignItems: 'center' }} direction="column">
														<Grid item>
															<Chip color={
																this.state.data.priority === "critical" ? "error" :
																	(this.state.data.priority === "high") ? "warning" :
																		(this.state.data.priority === "normal") ? "success" :
																			"default"
															}
																label={Boolean(this.state.data.priority) ? this.state.data.priority : " -- "} />
														</Grid>
														<Grid item>
															<Paper elevation={0}>Priority</Paper>
														</Grid>
													</Grid>
												</Grid>
											</Grid>
										</Grid>
									</Grid>
								</Grid>

								<Grid item className='card-description-field'>
									<Grid>
										<Paper elevation={0} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Description</Typography></Paper>
										<Editor
											onChange={this.descriptionChanged}
											value={this.state.data.description || ""}
											className='description'
											label="Description"
										/>
									</Grid>
								</Grid>

							</Grid>
						</Accordion>
						<Accordion expanded={this.state[Item.SCHEDULE_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="schedule-content" id={Item.SCHEDULE_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>Schedule</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Planned Dates</Typography></Paper>
								<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Actual Dates</Typography></Paper>
								<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Time Box</Typography></Paper>
							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state[Item.CONNECTIONS_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="connections-content" id={Item.CONNECTIONS_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>Connections</Typography>

							</AccordionSummary>
							<AccordionDetails>
								{this.state.parents.length ?
									<ConnectionTable
										items={this.state.parents}
										title="Parents"
										titleType={fieldHeaderType}
									/> : null}
								{this.state.descendants.length ?
									<ConnectionTable
										title="Descendants"
										titleType={fieldHeaderType}
										items={this.state.descendants}
									/> : null}
							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state[Item.PEOPLE_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="people-content" id={Item.PEOPLE_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>People</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Assigned Users</Typography></Paper>
								<AssignedUserTable card={this.state.data} />
								<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Involved Users</Typography></Paper>
								<CardUserTable card={this.state.data} />
							</AccordionDetails>
						</Accordion>

					</CardContent>


				</Card>
			)
		} else {
			return <div id="dead" />
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