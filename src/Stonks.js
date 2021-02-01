import React, { Component } from 'react';
import axios from 'axios';
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import './Stonks.scss'

let INCREMENTS = {
    m: "minute",
    h: "hour",
    d: "day",
    w: "week"
}
class Stonks extends Component {
    state = {
        loading: false,
        postData: [],
        amount: 0,
        amountCounter: 0,
        keyword: "",
        timeIncrement: "d",
        comments: false,
        chartTitle: "",
        seriesName: ""
    }

    fetchRedditData () {
        let i = this.state.amountCounter;
        let timeIncrement = this.state.timeIncrement;
        let comments = this.state.comments;
        let keyword = this.state.keyword;
        if (i > 0) {
            axios.get(`http://localhost:4567/${keyword}?comments=${comments}&after=${i}&before=${i - 1}&timeincrement=${timeIncrement}`).then(response => {
                console.log(response);
                let postData = this.state.postData;
                postData.push(response.data);
                this.setState({
                    postData: postData,
                    amountCounter: --i,
                    loading: i > 0
                });
                window.setTimeout(this.fetchRedditData.bind(this), 500);
            });
        } else {
            console.log("Try again!");
        }
    }

    setChartTitle () {
        let chartTitle = "";
        let postType = this.state.comments ? "Comments" : "Posts";
        let increment = INCREMENTS[this.state.timeIncrement];
        if (postType && increment) {
            chartTitle = `${postType} per ${increment}`;
        }
        return chartTitle;
    }

    getChartOptions () {
        return {
            title: {
                text: this.state.chartTitle
            },
            colors: ["blue"],
            chart: {
                // height: 200,
                width: 1000,
                type: "line"
            },
            xAxis: {
                categories: this.state.postData ? this.state.postData.map(dataSet => dataSet[0]) : []
            },
            yAxis: {
                title: {
                    text: null
                }
            },
            series: [{
                name: this.state.seriesName,
                data: this.state.postData ? this.state.postData.map((dataSet, i) => {
                    return {
                        y: dataSet[1],
                        key: i
                    }
                }) : []
            }]
        };
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
    
        this.setState({
          [name]: value
        });
    }

    handleRun (event) {
        event.preventDefault()
        this.setState({
            postData: [],
            amountCounter: this.state.amount,
            loading: true,
            chartTitle: this.setChartTitle(),
            seriesName: this.state.keyword
        }, this.fetchRedditData.bind(this));
    }

    render () {
        let getChart = () => {
            let chart = 
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={this.getChartOptions()}
                        // immutable={true}
                    />;
            return chart;
        }

        let buttonClass = this.state.loading ? "loading" : "inactive";

        return (
            <div className="Stonks">
                <h3>Reddit Hype</h3>
                <form onSubmit={this.handleRun.bind(this)}>
                    <div>
                        <label>
                            <span>Comments</span>
                            <input 
                                type="checkbox" 
                                name="comments" 
                                checked={this.state.comments} 
                                onChange={this.handleInputChange.bind(this)}/>
                        </label>
                    </div>
                    <div>
                        <input 
                            type="text" 
                            name="keyword" 
                            value={this.state.keyword} 
                            onChange={this.handleInputChange.bind(this)}/>
                    </div>
                    <div>
                        <input
                            type="number"
                            name="amount"
                            value={this.state.amount}
                            onChange={this.handleInputChange.bind(this)}/>
                        <select
                            name="timeIncrement" 
                            value={this.state.timeIncrement} 
                            onChange={this.handleInputChange.bind(this)}>
                            <option value="m">Minutes</option>
                            <option value="h">Hours</option>
                            <option value="d">Days</option>
                            <option value="w">Weeks</option>
                        </select>
                    </div>
                    <input type="submit" value="Run" className={buttonClass} />
                </form>

                {this.state.chartTitle ? getChart() : ""}
            </div>
        );
    }
}

export default Stonks;