import { AddCircle } from "@mui/icons-material";
import { Button, IconButton, ImageList, ImageListItem, ImageListItemBar, Paper, Typography } from "@mui/material";
import React from "react";
import { cleanIconPath, getBoardIcons, removeCardIcon, setCardIcon } from "../../Utils/Client/Sdk";

/**
 * Display the list of current icon and if the user clicks in the field, then load the current
 * icon list for the board the card is on
 */

export class APCustomIcon extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            card: this.props.card || null,
            showChooser: false,
            boardIcons: []
        }
    }

    iconChange = (evt, { newValue }) => {
        this.setState((prev) => {
            return {
                icon: newValue
            }
        })
    }

    getPossibleIcons = () => {
        getBoardIcons(this.props.host, this.props.card.board.id).then((result) => {
            if (result) this.setState({ boardIcons: result.customIcons })
        })
    }

    componentDidMount() {
        this.getPossibleIcons()
    }

    setIcon = (evt) => {
        setCardIcon(this.props.host, this.props.card.id, evt.currentTarget.id).then((newCard) => {
            this.setState({ card: newCard, showChooser: false })
        })
    }

    removeIcon = (evt) => {
        var icon = evt.currentTarget.value
        removeCardIcon(this.props.host, this.props.card.id, icon.id).then((newCard) => {
            if (newCard) {
                this.setState({ card: newCard })
            }
        })
    }

    toggleChooser = (evt) => {
        this.setState((prev) => ({showChooser: !prev.showChooser}))
    }

    render() {
        return (
            <>
                <Button onClick={this.toggleChooser}>
                    <img style={{ width: "100", height: "100" }} src={cleanIconPath(this.state.card.customIcon.iconPath)} alt={this.state.card.customIcon.title} loading="lazy"></img>
                </Button>
                <Paper elevation={0}>{this.state.card.customIcon.title}</Paper>
                {(this.props.readOnly || !this.state.showChooser) ? null :
                    <ImageList sx={{ width: 300, height: 300 }}>
                        {this.state.boardIcons.map((icon) => (
                            <ImageListItem  id={icon.id}  onClick={this.setIcon} key={icon.id}>
                                <img id={icon.id} style={{ width: 25, height: 25 }} src={cleanIconPath(icon.iconPath)} alt={icon.title} loading="lazy"></img>
                                <ImageListItemBar position="below" title={icon.name}/>
                            </ImageListItem>
                        ))}
                    </ImageList>
                }
            </>
        );
    }
}