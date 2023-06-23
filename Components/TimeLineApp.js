import React from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { Typography } from "@mui/material";
import * as d3 from 'd3';

export class TimeLineApp extends React.Component {

    constructor(props) {
        super(props);
    }
    render() {
        var nodes = this.props.data.descendants()
        var titles = [];
        nodes.each
        var tlg = (
            <Grid container>
                <Grid xs="auto">
                    <Typography>
                        Hello World
                    </Typography>
                </Grid>
                <Grid xs={6}>
                    Fixed Width
                </Grid>
            </Grid>
        )
        return tlg;
    }
}