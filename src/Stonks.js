import React, { Component } from 'react';
import axios from 'axios';
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import './Stonks.scss'
import { findRenderedComponentWithType } from 'react-dom/test-utils';

const BASE_URL = "http://localhost:4567/";
const REDDIT_URL = "https://www.reddit.com/"

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
        amount: 2,
        amountCounter: 0,
        keyword: "",
        timeIncrement: "d",
        comments: false,
        postType: "P",
        chartTitle: "",
        seriesName: "",
        redditData: [],
        afterID: ""
    }

    fetchPushshiftData () {
        let i = this.state.amountCounter;
        let timeIncrement = this.state.timeIncrement;
        let postType = this.state.postType;
        let keyword = this.state.keyword;
        let url = `${BASE_URL}pushshift/${keyword}?posttype=${postType}&after=${i}&before=${i - 1}&timeincrement=${timeIncrement}`;

        if (i > 0) {
            axios.get(url).then(response => {
                console.log(response.data);
                if (response.data[1] !== null) {
                    let postData = this.state.postData;
                    postData.push(response.data);
                    this.setState({
                        postData: postData,
                        amountCounter: --i,
                        loading: i > 0
                    });
                }
                window.setTimeout(this.fetchPushshiftData.bind(this), 300);
            });
        }
    }

    setChartTitle () {
        let chartTitle = "";
        let postType = this.state.postType === "C" ? "Comments" : "Posts";
        let increment = INCREMENTS[this.state.timeIncrement];
        if (postType && increment) {
            chartTitle = `${postType} per ${increment}`;
        }
        return chartTitle;
    }

    getChartOptions () {
        return {
            title: {
                text: this.state.chartTitle,
                style: {color: "white"}
            },
            colors: ["lightgreen"],
            chart: {
                // height: 200,
                // width: "100%",
                type: "line",
                backgroundColor: "#282c34"
            },
            xAxis: {
                categories: this.state.postData ? this.state.postData.map(dataSet => dataSet[0]) : [],
                labels: {
                    style: {color: "white"}
                }
            },
            yAxis: {
                title: {
                    text: null
                },
                labels: {
                    style: {color: "white"}
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
            }],
            legend: {
                itemStyle: {
                    color: "white"
                }
            }
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
        }, this.fetchPushshiftData.bind(this));
    }

    handleRedditClick (event, afterID) {
        if (this.state.token) { 
            this.fetchRedditApi(null, afterID);
        } else {
            this.getTokenThenFetch(afterID);
        }
    }

    getTokenThenFetch (afterID) {
        axios.get(`${BASE_URL}access_token`).then(response => {
            console.log(response)
            this.setState({
                token: response.data
            }, () => {
                this.fetchRedditApi(null, afterID);
            });
        });
    }

    fetchRedditApi (event, afterID) {
        let url = `${BASE_URL}reddit/${this.state.keyword}`

        let params = {} 
        if (afterID) {
            params.after = afterID;
        }
        if (this.state.token) {
            params.token = this.state.token;
        }

        axios.get(url, {params: params}).then(response => {
            console.log(response);
            this.setState({
                redditData: response.data.children,
                afterID: response.data.after
            });
        });
    }

    nextPage () {
        this.handleRedditClick(null, this.state.afterID);
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
                    <div className="radio">
                        <label>
                            Posts
                            <input
                                type="radio"
                                name="postType"
                                value="P"
                                checked={this.state.postType === "P"}
                                onChange={this.handleInputChange.bind(this)}
                            />
                        </label>
                        <label>
                            Comments
                            <input
                                type="radio"
                                name="postType"
                                value="C"
                                checked={this.state.postType === "C"}
                                onChange={this.handleInputChange.bind(this)}
                            />
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

                <div className="chart">
                    {this.state.chartTitle ? getChart() : ""}
                </div>

                <button onClick={this.handleRedditClick.bind(this)}>Fetch from Reddit API</button>
                <div className="reddit-links">
                    {this.state.redditData ? this.state.redditData.map((post, i) => {
                        return (<div className="reddit-link" key={i}>
                            <a href={REDDIT_URL + post.data.permalink} target="_blank">{post.data.title}</a>
                        </div>);
                    }) : ""}
                    {this.state.afterID ? <button onClick={this.nextPage.bind(this)}>Next Page</button> : ""}
                </div>
            </div>
        );
    }
}

export default Stonks;