import { CalendarToday, CancelPresentation, Delete, DeleteForever, ExpandMore, KeyboardDoubleArrowDown, KeyboardDoubleArrowUp, List, Logout, People, SaveAltOutlined, SettingsEthernet } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Card, CardActions, CardContent, Grid, IconButton, Paper, TextField, Tooltip, Typography } from "@mui/material";

import { APBlocked } from "@/Components/AP-Fields/blocked";
import { APdateRange } from "@/Components/AP-Fields/dateRange";
import { APdescription } from "@/Components/AP-Fields/description";
import { APPriority } from "@/Components/AP-Fields/priority";
import { APSize } from "@/Components/AP-Fields/size";
import { AssignedUserTable } from "@/Components/AssignedUserTable";
import { CardUserTable } from "@/Components/CardUserTable";
import { ConnectionTable } from "@/Components/ConnectionTable";
import React from "react";


export class APcard extends React.Component {

	static CONNECTIONS_PANEL_NAME = "connectionsSection";
	static PEOPLE_PANEL_NAME = "peopleSection";
	static DETAILS_PANEL_NAME = "detailsSection";
	static SCHEDULE_PANEL_NAME = "scheduleSection"
	constructor(props) {
		super(props);

		this.state = {
			data: props.card || null,
			description: props.card || props.card.description,
			changed: false,
			context: props.context || null,
			contextIcons: null,
			openAll: true,
			blocked: props.card || props.card.blockedStatus.isBlocked,
			loadSource: props.loadType || 'card'
		}
		this.state[APcard.CONNECTIONS_PANEL_NAME] = false;
		this.state[APcard.PEOPLE_PANEL_NAME] = false;
		this.state[APcard.DETAILS_PANEL_NAME] = true;
		this.state[APcard.SCHEDULE_PANEL_NAME] = false;

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

	cleanIconPath = (path) => {
		var pos = path.search("/customicons")
		var newPath = path.substr(pos);
		return newPath
	}

	handleAccordionChange = (event, requestedState) => {
		var ed = {};
		ed[event.currentTarget.id] = requestedState;
		this.setState(ed);
	}

	toggleBlocked = (evt) => {

		if (!this.props.readOnly) this.setState((prev) => { return { blocked: !prev.blocked } })
	}

	changeSection = (evt) => {
		var ed = {}

		ed[APcard.DETAILS_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[APcard.PEOPLE_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[APcard.CONNECTIONS_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[APcard.SCHEDULE_PANEL_NAME] = evt.currentTarget.id === "openAll";

		if ((evt.currentTarget.id !== "openAll") && (evt.currentTarget.id !== "closeAll")) {
			ed[evt.currentTarget.id] = true;
		}
		this.setState(ed)
		evt.currentTarget.scrollIntoView({ block: 'end', inline: 'nearest' })


	}

	render() {
		var sectionHeaderType = "h5"
		var fieldHeaderType = "h6"

		var typeTitle = (this.state.loadSource === 'card') ?  this.state.data.type.title : this.state.data.cardType.name
		var typeColour = (this.state.loadSource === 'card') ?  this.state.data.type.cardColor : this.state.data.color
		if (this.state.data != null) {
			return (
				<Card sx={this.props.cardProps} variant='outlined' iid={this.state.data.id}>
					<Grid style={{ backgroundColor: typeColour }} container direction="row">
						<Grid item xs={6}>
							<CardActions style={{ backgroundColor: typeColour, justifyContent: 'left' }} >
								<Tooltip title="Open All">
									<IconButton id="openAll" size='large' className="options-button-icon" aria-label='open panels' onClick={this.changeSection}>
										<KeyboardDoubleArrowDown />
									</IconButton>
								</Tooltip>
								<Tooltip title="Details">
									<IconButton id={APcard.DETAILS_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<List />
									</IconButton>
								</Tooltip>
								<Tooltip title="Schedule">
									<IconButton id={APcard.SCHEDULE_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<CalendarToday />
									</IconButton>
								</Tooltip>
								<Tooltip title="Connections">
									<IconButton id={APcard.CONNECTIONS_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<SettingsEthernet />
									</IconButton>
								</Tooltip>
								<Tooltip title="People">
									<IconButton id={APcard.PEOPLE_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<People />
									</IconButton>
								</Tooltip>
								<Tooltip title="Close All">
									<IconButton id="closeAll" size='large' className="options-button-icon" aria-label='close panels' onClick={this.changeSection}>
										<KeyboardDoubleArrowUp />
									</IconButton>
								</Tooltip>
							</CardActions>
						</Grid>
						{!this.props.readOnly ?
							<Grid item xs={6}>
								<CardActions style={{ backgroundColor: typeColour, justifyContent: 'right' }} >
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
							: null}
					</Grid>
					<CardContent sx={{ backgroundColor: typeColour }}>
						<Accordion expanded={this.state[APcard.DETAILS_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="details-content" id={APcard.DETAILS_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>{this.state[APcard.DETAILS_PANEL_NAME] ? typeTitle + ": " + this.state.data.id : this.state.data.title}</Typography>
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
													<APBlocked
														status={this.state.data.blockedStatus}
														toggleBlocked={this.toggleBlocked}
													/>
												</Grid>
												<Grid xs={2} item>
													<APSize
														size={this.state.data.size}
													/>
												</Grid>
												<Grid xs={2} item>
													<APPriority
														priority={this.state.data.priority}
													/>
												</Grid>
												<Grid xs={2} item>
													<Grid container sx={{ alignItems: 'center' }} direction="column">
														{Boolean(this.state.data.customIcon) ? (
															<>
																<Grid item sx={{ margin: "0px" }}>
																	<img style={{ width: "28px", height: "28px" }} alt={this.state.data.customIcon.name} src={this.state.data.customIcon.iconPath} />
																</Grid>
																<Grid item>
																	<Paper elevation={0}>{this.state.data.customIcon.title}</Paper>
																</Grid>
															</>
														) : null}
													</Grid>
												</Grid>
											</Grid>
										</Grid>
									</Grid>
								</Grid>

								<Grid item className='card-description-field'>
									<APdescription
										description={this.state.data.description}
										onChange={this.descriptionChanged}
										headerType={fieldHeaderType}
									/>
								</Grid>

							</Grid>
						</Accordion>
						<Accordion expanded={this.state[APcard.SCHEDULE_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="schedule-content" id={APcard.SCHEDULE_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>Schedule</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Grid container direction="row">
									<Grid item className='card-description-field' >
										<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Planned Dates</Typography>
										</Paper>
										<APdateRange
											start={this.state.data.plannedStart}
											end={this.state.data.plannedFinish}
										/>
									</Grid>
									<Grid item className='card-description-field' >
										<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Actual Dates</Typography></Paper>
										<APdateRange
											start={this.state.data.actualStart}
											end={this.state.data.actualFinish}
										/>
									</Grid>
									<Grid item className='card-description-field' >
										<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Time Box</Typography></Paper>
									</Grid>
								</Grid>
							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state[APcard.CONNECTIONS_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="connections-content" id={APcard.CONNECTIONS_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>Connections</Typography>

							</AccordionSummary>
							<AccordionDetails>
								{this.props.parents.length ?
									<ConnectionTable
										items={this.props.parents}
										title="Parents"
										titleType={fieldHeaderType}
									/> : null}
								{this.props.descendants.length ?
									<ConnectionTable
										title="Descendants"
										titleType={fieldHeaderType}
										items={this.props.descendants}
									/> : null}
							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state[APcard.PEOPLE_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="people-content" id={APcard.PEOPLE_PANEL_NAME} expandIcon={<ExpandMore />}>
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