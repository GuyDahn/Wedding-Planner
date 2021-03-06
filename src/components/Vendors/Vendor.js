import React, { Component } from 'react';
import { observer, inject } from "mobx-react";
import {toast as popup} from 'react-toastify'
import VendorCard from './Card';

@inject("attractions", "user")

@observer
class Vendor extends Component {
    removeFavorite = async ()  =>{
      let remove = await this.props.user.removeFavorite(this.props.user.userInfo.id,this.props.attr.id)
      popup.success(remove)
    }
    addToFavorites = async () => {
        let add = await this.props.user.addToFavorites(this.props.user.userInfo.id, this.props.attr.id)
        popup.success(add)
    }

    isFavorite = () => {
        return this.props.user.isFavorite(this.props.attr.id)
    }
    render() {
        //rewrite new code
        let bookedAttractions=this.props.user.bookedAttractions
        let isBooked=bookedAttractions.some(f => f.category === this.props.attr.category)
        let isFavorite=this.isFavorite()
        let attraction = this.props.attr
        return (
            <div className="attraction">
            {attraction ?<VendorCard isBookedCategory={isBooked?this.props.attr.category:"null"}
             isFavorite={isFavorite} attraction={attraction} removeFavorite={this.removeFavorite} 
             addToFavorites={this.addToFavorites} changeFavoriteState={this.changeFavoriteState}/>:""}
            </div>
        )
    }
}

export default Vendor
