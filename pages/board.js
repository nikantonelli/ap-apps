import { Card, CardHeader, Grid } from "@mui/material";
import { Component } from "react";
import BoardService from "../services/BoardService"
import AgilePlace from "../utils/AgilePlace";

import { useState } from 'react'

export default function Board({brds}) {

	const [boards, setBoards] = useState(brds);

	function cardClicked (evt) {
		document.open("/board/" + evt.currentTarget.id,"", "noopener=true")
	}

		return <Grid container>
			{boards.map((brd, key) => {
				return <Grid key={key} item>
					<Card
						id={brd.id}
						sx={{ minWidth: 300 }}
						variant="outlined"
						onClick={cardClicked}
					>
						<CardHeader title={brd.title} />
					</Card>
				</Grid>
			})}
		</Grid>
	
}

export async function getServerSideProps() {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new AgilePlace(process.env.AGILEPLACE, process.env.AGILEUSER, process.env.AGILEPASS, process.env.AGILEKEY)
	}
	var bs = new BoardService();
	var result = await bs.find()
	return {props: {brds : result.boards}}
}
