import { PlaylistRemove } from "@mui/icons-material";
import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material";
import React from "react";

export class ConnectionTable extends React.Component {

    CHILD_RELATIONSHIP = "Child";
    PARENT_RELATIONSHIP = "Parent";
  
    openBoard = (evt) => {
        document.open("/nui/board/" + evt.currentTarget.id, "", "noopener=true")
    }

    openCard = (evt) => {
        document.open("/nui/card/" + evt.currentTarget.id, "", "noopener=true")
    }
    render = () => {
        var data = [];
        if (this.props.descendants && this.props.descendants.length) this.props.descendants.forEach((item) => {
            data.push({ type: this.CHILD_RELATIONSHIP, data: item })
        })
        if (this.props.parents && this.props.parents.length) this.props.parents.forEach((item) => {
            data.push({ type: this.PARENT_RELATIONSHIP, data: item })
        })

        return (
            <TableContainer sx={{maxHeight:200}} component={Paper}>
                <Table stickyHeader sx={{ minWidth: 500 }} size="small" aria-label="card connection table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Header</TableCell>
                            <TableCell>Context</TableCell>
                            <TableCell>Type</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row, idx) => (
                            row.data ?
                                <TableRow
                                    key={idx}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell  className="clickable" id= {row.data.id} onClick={this.openCard} component="th" scope="row">
                                        {row.data.title}
                                    </TableCell>
                                    <TableCell>{row.data.customId.value}</TableCell>
                                    <TableCell className="clickable" id= {row.data.board.id} onClick={this.openBoard} >{row.data.board.title}</TableCell>
                                    <TableCell>{row.type}</TableCell>

                                </TableRow>
                                : <TableRow key={idx}/>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }
}