import { CalendarToday, CancelPresentation, Delete, DeleteForever, ExpandMore, HighlightOffOutlined, KeyboardDoubleArrowDown, KeyboardDoubleArrowUp, List, Logout, People, SaveAltOutlined, SettingsEthernet } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Card, CardActions, CardContent, Grid, IconButton, Paper, TextField, Tooltip, Typography } from "@mui/material";

import { APBlocked } from "./AP-Fields/blocked";
import { APdateRange } from "./AP-Fields/dateRange";
import { APdescription } from "./AP-Fields/description";
import { APPriority } from "./AP-Fields/priority";
import { APSize } from "./AP-Fields/size";
import { AssignedUserTable } from "./AssignedUserTable";
import { CardUserTable } from "./CardUserTable";
import { ConnectionTable } from "./ConnectionTable";

import { getBoard, getCardChildren, getListOfCards } from "../utils/Client/Sdk"
import React from "react";
import { cardDescriptionFieldStyle, cardStyle, optionsButtonIconStyle, titleFieldStyle, titlePaperStyle } from "../styles/globals";
import { APChildStats } from "./ChildStats";

export class APHoverCard extends React.Component {

	static CONNECTIONS_PANEL_NAME = "connectionsSection";
	static PEOPLE_PANEL_NAME = "peopleSection";
	static DETAILS_PANEL_NAME = "detailsSection";
	static SCHEDULE_PANEL_NAME = "scheduleSection"
	constructor(props) {
		super(props);

		this.state = {
			data: props.card || null,
			description: props.card || props.card.description,
			context: props.context || null,
			contextIcons: null,
			openAll: true,
			loadSource: props.loadSource || 'card'
		}
		this.state[APHoverCard.CONNECTIONS_PANEL_NAME] = false;
		this.state[APHoverCard.PEOPLE_PANEL_NAME] = false;
		this.state[APHoverCard.DETAILS_PANEL_NAME] = true;
		this.state[APHoverCard.SCHEDULE_PANEL_NAME] = false;

		this.savedData = props.card;
	}

	handleAccordionChange = (event, requestedState) => {
		var ed = {};
		ed[event.currentTarget.id] = requestedState;
		this.setState(ed);
	}


	changeSection = (evt) => {
		var ed = {}

		ed[APHoverCard.DETAILS_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[APHoverCard.PEOPLE_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[APHoverCard.CONNECTIONS_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[APHoverCard.SCHEDULE_PANEL_NAME] = evt.currentTarget.id === "openAll";

		if ((evt.currentTarget.id !== "openAll") && (evt.currentTarget.id !== "closeAll")) {
			ed[evt.currentTarget.id] = true;
		}
		this.setState(ed)
		evt.currentTarget.scrollIntoView({ block: 'end', inline: 'nearest' })


	}
	

	render() {
		var sectionHeaderType = "h5"
		var fieldHeaderType = "h6"

		var typeColour =  this.state.data.type.cardColor
		if (this.state.data != null) {
			return (
				<Card sx={cardStyle} variant='outlined' iid={this.state.data.id}>
					<Grid style={{ backgroundColor: typeColour }} container direction="row">
						<Grid item xs={6}>
							<CardActions style={{ backgroundColor: typeColour, justifyContent: 'left' }} >
								<Tooltip title="Open All">
									<IconButton id="openAll" size='large' sx={optionsButtonIconStyle} aria-label='open panels' onClick={this.changeSection}>
										<KeyboardDoubleArrowDown />
									</IconButton>
								</Tooltip>
								<Tooltip title="Details">
									<IconButton id={APHoverCard.DETAILS_PANEL_NAME} size='large' sx={optionsButtonIconStyle} aria-label='details panel' onClick={this.changeSection}>
										<List />
									</IconButton>
								</Tooltip>
								<Tooltip title="Schedule">
									<IconButton id={APHoverCard.SCHEDULE_PANEL_NAME} size='large' sx={optionsButtonIconStyle} aria-label='details panel' onClick={this.changeSection}>
										<CalendarToday />
									</IconButton>
								</Tooltip>
								<Tooltip title="Connections">
									<IconButton id={APHoverCard.CONNECTIONS_PANEL_NAME} size='large' sx={optionsButtonIconStyle} aria-label='details panel' onClick={this.changeSection}>
										<SettingsEthernet />
									</IconButton>
								</Tooltip>
								<Tooltip title="People">
									<IconButton id={APHoverCard.PEOPLE_PANEL_NAME} size='large' sx={optionsButtonIconStyle} aria-label='details panel' onClick={this.changeSection}>
										<People />
									</IconButton>
								</Tooltip>
								<Tooltip title="Close All">
									<IconButton id="closeAll" size='large' sx={optionsButtonIconStyle} aria-label='close panels' onClick={this.changeSection}>
										<KeyboardDoubleArrowUp />
									</IconButton>
								</Tooltip>
							</CardActions>
						</Grid>

						<Grid item xs={6}>
							<CardActions style={{ backgroundColor: typeColour, justifyContent: 'right' }} >


								<Tooltip title="Close">
									<IconButton size='large' sx={optionsButtonIconStyle} aria-label="delete forever" onClick={this.props.onClose} >
										<HighlightOffOutlined />
									</IconButton>
								</Tooltip>
							</CardActions>
						</Grid>

					</Grid>
					<CardContent sx={{ backgroundColor: typeColour }}>
						<Accordion expanded={this.state[APHoverCard.DETAILS_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="details-content" id={APHoverCard.DETAILS_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>{this.state[APHoverCard.DETAILS_PANEL_NAME] ? this.state.data.type.title + ": " + this.state.data.id : this.state.data.title}</Typography>
							</AccordionSummary>
							<Grid container direction="column" >
								<Grid item>
									<Grid container direction="row">
										<Grid item sx={cardDescriptionFieldStyle} >
											<Grid>
												<Paper elevation={0} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Title</Typography></Paper>
												<TextField
													InputProps={{
														readOnly: true,
													}}
													variant="outlined"
													sx={cardDescriptionFieldStyle}
													value={this.state.data.title}
												/>
											</Grid>
										</Grid>
										<Grid item sx={cardDescriptionFieldStyle} >
											<Paper elevation={0} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>
												{"Status: " + ((this.state.data.actualFinish?.length) ?
													" Finished (" + this.state.data.actualFinish + ")" :
													(this.state.data.actualStart?.length) ?
														" Started (" + this.state.data.actualStart + ")" :
														" Not Started"

												)}
											</Typography></Paper>
											<Grid container direction="row">
												<Grid item sx={{margin: '0px 5px 0px 5px'}}>
													<APBlocked
														status={this.state.data.blockedStatus}
													/>
												</Grid>
												<Grid sx={{margin: '0px 5px 0px 5px'}} item>
													<APSize
														size={this.state.data.size}
													/>
												</Grid>
												<Grid item sx={{margin: '0px 5px 0px 5px'}}>
													<APPriority
														priority={this.state.data.priority}
													/>
												</Grid>
												<Grid item sx={{margin: '0px 5px 0px 5px'}}>
													<Grid container sx={{ alignItems: 'center' }} direction="column">
														{Boolean(this.state.data.customIcon) ? (
															<>
																<Grid item sx={{ margin: "0px" }}>
																	<img style={{ width: "28px", height: "28px" }} src={this.state.data.customIcon.iconPath} />
																</Grid>
																<Grid item>
																	<Paper elevation={0}>{this.state.data.customIcon.title}</Paper>
																</Grid>
															</>
														) : null}
													</Grid>
												</Grid>
												<Grid item >
													<APChildStats
														data={this.state.data}
														showByPoints
														showByCount
													/>
												</Grid>
											</Grid>
										</Grid>
									</Grid>
								</Grid>

								<Grid item sx={cardDescriptionFieldStyle}>
									<APdescription
										readOnly
										description={this.state.data.description}
										headerType={fieldHeaderType}
									/>
								</Grid>

							</Grid>
						</Accordion>
						<Accordion expanded={this.state[APHoverCard.SCHEDULE_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="schedule-content" id={APHoverCard.SCHEDULE_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>Schedule</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Grid container direction="row">
									<Grid item sx={cardDescriptionFieldStyle} >
										<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Planned Dates</Typography>
										</Paper>
										<APdateRange
											start={this.state.data.plannedStart}
											end={this.state.data.plannedFinish}
										/>
									</Grid>
									<Grid item sx={cardDescriptionFieldStyle} >
										<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Actual Dates</Typography></Paper>
										<APdateRange
											start={this.state.data.actualStart}
											end={this.state.data.actualFinish}
										/>
									</Grid>
									<Grid item sx={cardDescriptionFieldStyle} >
										<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Time Box</Typography></Paper>
									</Grid>
								</Grid>
							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state[APHoverCard.CONNECTIONS_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="connections-content" id={APHoverCard.CONNECTIONS_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>Connections</Typography>

							</AccordionSummary>
							<AccordionDetails>
								{this.props.parents?.length ?
									<ConnectionTable
										items={this.props.parents}
										title="Parents"
										titleType={fieldHeaderType}
									/> : null}
								{this.props.descendants?.length ?
									<ConnectionTable
										title="Descendants"
										titleType={fieldHeaderType}
										items={this.props.descendants}
									/> : null}
							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state[APHoverCard.PEOPLE_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="people-content" id={APHoverCard.PEOPLE_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>People</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Assigned Users</Typography></Paper>
								<AssignedUserTable card={this.state.data} />
								<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Involved Users</Typography></Paper>
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